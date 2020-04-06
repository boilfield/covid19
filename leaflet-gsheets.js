
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
  var polygonStyle = { color: "#f78c72", fillColor: "#f09d89", weight: 1.5 };
  var polygonHoverStyle = { color: "#f5eb5d", fillColor: "#f7ea2f", weight: 15};

  polygonLayer = L.geoJSON(geojsonStates, {
    onEachFeature: function(feature, layer) {

      layer.on({
        mouseout: function(e) {
          e.target.setStyle(polygonStyle);
          e.target.bindPopup('<h6 style="text-align:center; color:#0000ff; margin-bottom:2px">'+ feature.properties.name +'</h6>');
        },
        mouseover: function(e) {
          e.target.setStyle(polygonHoverStyle);
          // e.target.bindPopup('<h6 style="text-align:center; color:#0000ff; margin-bottom:2px">'+ feature.properties.name +'</h6>');
          // var html = '<h6 style="text-align:center; color:#0000ff; margin-bottom:2px">'+ feature.properties.name +'</h6>';
          // layer.bindPopup(html);
        },
        click: function(e) {
                    
                    var html = '<h6 style="text-align:center; color:#0000ff; margin-bottom:2px">'+ feature.properties.name +'</h6>';
                    html += 'Quarantined: <b>' + feature.properties.quarantine + '</b><br/>';
                    html += 'Recovered: <b>' + feature.properties.recover + '</b><br/>';
                    // html += 'Confirmed: <b>' + feature.properties.confirmed + '</b><br/>';
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
