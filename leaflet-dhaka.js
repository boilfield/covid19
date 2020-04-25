
// init() is called as soon as the page loads
function init() {
  // PASTE YOUR URLs HERE
  // these URLs come from Google Sheets 'shareable link' form
  // the first is the polygon layer and the second the points
 
  var polyURL =
    "https://docs.google.com/spreadsheets/d/1CVAPcNM5sOUQnKv8vJ2kcSgtvq3d6AzQcdURcEWYtoQ/edit?usp=sharing";
  // var pointsURL =
  //   //"https://docs.google.com/spreadsheets/d/1kjJVPF0LyaiaDYF8z_x23UulGciGtBALQ1a1pK0coRM/edit?usp=sharing";

  Tabletop.init({ key: polyURL, callback: addPolygons, simpleSheet: true });
  // Tabletop.init({ key: pointsURL, callback: addPoints, simpleSheet: true }); // simpleSheet assumes there is only one table and automatically sends its data
}
window.addEventListener("DOMContentLoaded", init);

// Create a new Leaflet map centered on the continental US [23.699, 89.308], 7
var map = L.map("map").setView([23.7929, 90.4175], 12);

// This is the Carto Positron basemap
var hash = new L.Hash(map);

var basemap = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    minZoom:9,
    attribution: 'Map data &copy; <a href="https://www.iedcr.gov.bd/" target="_blank">IEDCR</a> contributors, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.light'
  });
basemap.addTo(map);

//Zoom Comtroler
map.zoomControl.remove();
// map.on('click', function (feature, layer) {
//   // sidebar.close(panelID);
// });
 // L.control.locate().addTo(map);




// These are declared outisde the functions so that the functions can check if they already exist
var polygonLayer;
// The form of data must be a JSON representation of a table as returned by Tabletop.js
// addPolygons first checks if the map layer has already been assigned, and if so, deletes it and makes a fresh one
// The assumption is that the locally stored JSONs will load before Tabletop.js can pull the external data from Google Sheets
function addPolygons(data) {
  if (polygonLayer != null) {
    // If the layer exists, remove it and continue to make a new one with data
    polygonLayer.remove();
  }

  // Need to convert the Tabletop.js JSON into a GeoJSON
  // Start with an empty GeoJSON of type FeatureCollection
  // All the rows will be inserted into a single GeoJSON
  var geojsonStates = {
    type: "FeatureCollection",
    features: []
  };
  for (var row in data) {
    // The Sheets data has a column 'include' that specifies if that row should be mapped
    if (data[row].include == "y") {
      var coords = JSON.parse(data[row].geometry);
      geojsonStates.features.push({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: coords
        },
        properties: {
          name: data[row].name,
          confirmed: data[row].confirmed,
          deaths: data[row].deaths,
          recover: data[row].recover,
          quarantine: data[row].quarantine,
          male: data[row].male,
          female: data[row].female,
          child: data[row].child,
          web: data[row].web,
          image: data[row].image
        }
      });
    }
  }
  // The polygons are styled slightly differently on mouse hovers
  var polygonStyle = { color: "#f78c72", fillColor: "#f78c72" , weight: 1.5, fillOpacity: 1};
  var polygonHoverStyle = { color: "#f5eb5d", fillColor: "#f7ea2f", weight: 1.5, fillOpacity: 1};





  polygonLayer = L.geoJSON(geojsonStates, {
    onEachFeature: function(feature, layer) {

      layer.on({
        mouseout: function(e) {
          e.target.setStyle({  // Need to manually set each property except `fillColor`
            color: polygonStyle.color,
            weight: polygonStyle.weight,
            fillColor: feature.fill_color,  // Use saved color
          });

          // e.target.bindPopup('<h6 style="text-align:center; color:#0000ff; margin-bottom:2px">'+ feature.properties.confirmed +'</h6>');
        },
        mouseover: function(e) {
          e.target.setStyle(polygonHoverStyle);

        },
        click: function(e) {
                    // var html = '<h6 style="text-align:center; color:#0000ff; margin-bottom:2px">'+ feature.properties.name +'</h6>';
                    var html = 'Confirmed: <b>' + feature.properties.confirmed + '</b><br/>';
                    html += 'Recovered: <b>' + feature.properties.recover + '</b><br/>';
                    html += 'Death: <b>' + feature.properties.deaths + '</b><br/>';
                    // html += '<h6 style="text-align:center; color:#fff000; margin-bottom:2px">' + feature.properties.web +'</h6>';
                    // html += 'Male: <b>' + feature.properties.male + '</b><br/>';
                    // html += 'Female: <b>' + feature.properties.female + '</b><br/>';
                    // html += 'Child: <b>' + feature.properties.child + '</b><br/>';
                    layer.bindPopup(html);
                }
      });



      let label = L.marker(layer.getBounds().getCenter(), {
      icon: L.divIcon({
        className: 'label',
        html: feature.properties.name +'<br/><h6 style="text-align:center; color:#ff0000; margin-bottom:2px"> ' + feature.properties.confirmed +' </h6>',
      })
    }).addTo(map);
    },
    style: polygonStyle
  }).addTo(map);



  // Set different polygon fill colors based on number of quarantined
  polygonLayer.eachLayer(function (layer) {
    let d = layer.feature.properties.confirmed;
    let fc = d > 500 ? '#800026' :
          // d > 500  ? '#BD0026' :
          // d > 200  ? '#E31A1C' :
          d > 100  ? '#BD0026' :
          d > 50   ? '#FC4E2A' :
          d > 20   ? '#FD8D3C' :
          // d > 10   ? '#FEB24C' :
          d > 0    ? '#FED976' :
          '#FFFFFF';
    layer.setStyle({fillColor: fc});
    layer.feature.fill_color = fc;  // Save color to use again after mouseout
  });

}

//bound box
var bounds_group = new L.featureGroup([]);
        function setBounds() {
            if (bounds_group.getLayers().length) {
                map.fitBounds(bounds_group.getBounds());
            }
            map.setMaxBounds(map.getBounds());
        }setBounds();



    //logo position: bottomright, topright, topleft, bottomleft
    var logo = L.control({position: 'bottomleft'});
    logo.onAdd = function(map){
        var div = L.DomUtil.create('div', 'myclass');
        div.innerHTML= "<a href='https://boiledbhoot.org/' target='_blank'>Powered & maintaied by <img height='25px' src='boil.png'/></a>";
        return div;
    }
    logo.addTo(map);


    //Scale
    // L.control.scale().addTo(map);



let legend = L.control({position: "bottomright"});
legend.onAdd = function (map) {
  let cont_div = L.DomUtil.create('div', 'info legend');
  cont_div.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  cont_div.style.padding = "10px";
  cont_div.innerHTML = `
    <div><b>Confirmed Cases</b></div>
    <style>
      .legend-cb {
        height: 0.8em;
        width: 10px;
        display: inline-block;
        margin-right: 5px;
        text-align: center;
      }
    </style>
    <div>
      <span class="legend-cb" style="background-color: #800026"></span>
      <span>500+ person</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #BD0026"></span>
      <span>101-499 person</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FC4E2A"></span>
      <span>51-100 person</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FD8D3C"></span>
      <span>21-50 person</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FED976"></span>
      <span>1-20 person</span>
    </div>
  `;
  return cont_div;
}
legend.addTo(map);

