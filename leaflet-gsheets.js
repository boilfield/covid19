
// init() is called as soon as the page loads
function init() {
  // PASTE YOUR URLs HERE
  // these URLs come from Google Sheets 'shareable link' form
  // the first is the polygon layer and the second the points
 
  var polyURL =
    "https://docs.google.com/spreadsheets/d/1vsCq5u22w6IjKXyoOWQefDcPzgf9IIRswXs4ActkziU/edit?usp=sharing";
  // var pointsURL =
  //   //"https://docs.google.com/spreadsheets/d/1kjJVPF0LyaiaDYF8z_x23UulGciGtBALQ1a1pK0coRM/edit?usp=sharing";

  Tabletop.init({ key: polyURL, callback: addPolygons, simpleSheet: true });
  // Tabletop.init({ key: pointsURL, callback: addPoints, simpleSheet: true }); // simpleSheet assumes there is only one table and automatically sends its data
}
window.addEventListener("DOMContentLoaded", init);

// Create a new Leaflet map centered on the continental US [23.699, 89.308], 7
var map = L.map("map").setView([24.067, 90.352], 6);

// This is the Carto Positron basemap
var hash = new L.Hash(map);

var basemap = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  // "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='http://cartodb.com/attributions'>CartoDB</a>",
    subdomains: "abcd",
    maxZoom: 9,
    minZoom:6
  }
); 
basemap.addTo(map);

//Zoom Comtroler
map.zoomControl.remove();
// map.on('click', function (feature, layer) {
//   // sidebar.close(panelID);
// });





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
          image: data[row].image
        }
      });
    }
  }
  // The polygons are styled slightly differently on mouse hovers
  var polygonStyle = { color: "#f78c72", fillColor: "#f78c72" , weight: 1.5 };
  var polygonHoverStyle = { color: "#f5eb5d", fillColor: "#f7ea2f", weight: 1.5};





  polygonLayer = L.geoJSON(geojsonStates, {
    onEachFeature: function(feature, layer) {

      layer.on({
        mouseout: function(e) {
          e.target.setStyle({  // Need to manually set each property except `fillColor`
            color: polygonStyle.color,
            weight: polygonStyle.weight,
            fillColor: feature.fill_color,  // Use saved color
          });
          e.target.bindPopup('<h6 style="text-align:center; color:#0000ff; margin-bottom:2px">'+ feature.properties.name +'</h6>');
        },
        mouseover: function(e) {
          e.target.setStyle(polygonHoverStyle);
        },
        click: function(e) {
                    
                    var html = '<h6 style="text-align:center; color:#0000ff; margin-bottom:2px">'+ feature.properties.name +'</h6>';
                    html += 'Quarantined: <b>' + feature.properties.quarantine + '</b><br/>';
                    html += 'Recovered: <b>' + feature.properties.recover + '</b><br/>';
                    html += 'Death: <b>' + feature.properties.deaths + '</b><br/>';
                    html += 'Male: <b>' + feature.properties.male + '</b><br/>';
                    html += 'Female: <b>' + feature.properties.female + '</b><br/>';
                    html += 'Child: <b>' + feature.properties.child + '</b><br/>';
                    layer.bindPopup(html);
                }
      });
    },
    style: polygonStyle
  }).addTo(map);

  // Set different polygon fill colors based on number of quarantined
  polygonLayer.eachLayer(function (layer) {
    let d = layer.feature.properties.quarantine;
    let fc = d > 1000 ? '#800026' :
          d > 500  ? '#BD0026' :
          d > 200  ? '#E31A1C' :
          d > 100  ? '#FC4E2A' :
          d > 50   ? '#FD8D3C' :
          d > 20   ? '#FEB24C' :
          d > 10   ? '#FED976' :
          '#FFEDA0';
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
        div.innerHTML= "<img src='boil.png'/>";
        return div;
    }
    logo.addTo(map);


    //Scale
    L.control.scale().addTo(map);



//     function getColor(d) {
//     return d > 1000 ? '#800026' :
//            d > 500  ? '#BD0026' :
//            d > 200  ? '#E31A1C' :
//            d > 100  ? '#FC4E2A' :
//            d > 50   ? '#FD8D3C' :
//            d > 20   ? '#FEB24C' :
//            d > 10   ? '#FED976' :
//                       '#FFEDA0';
// }

function style(feature) {
    return {
        fillColor: getColor(feature.properties.quarantine),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// L.geoJson(geojsonStates, {style: style}).addTo(map);

let legend = L.control({position: "bottomright"});
legend.onAdd = function (map) {
  let cont_div = L.DomUtil.create('div', 'info legend');
  cont_div.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
  cont_div.style.padding = "10px";
  cont_div.innerHTML = `
    <div><b>Quarantine color code</b></div>
    <style>
      .legend-cb {
        height: 0.8em;
        width: 10px;
        display: inline-block;
        margin-right: 5px;
      }
    </style>
    <div>
      <span class="legend-cb" style="background-color: #800026"></span>
      <span>n > 1000</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #BD0026"></span>
      <span>999 > n > 500</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #E31A1C"></span>
      <span>499 > n > 100</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FC4E2A"></span>
      <span>99 > n > 50</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FD8D3C"></span>
      <span>49 > n > 20</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FEB24C"></span>
      <span>19 > n > 10</span>
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FED976"></span>
      <span>9 > n</span>
    </div>
  `;
  return cont_div;
}
legend.addTo(map);
