
// init() is called as soon as the page loads
function init() {
  // PASTE YOUR URLs HERE

 
  var polyURL ="https://docs.google.com/spreadsheets/d/1WG9Sikm2PUkKdmsm2tm8iCZEiqpKKXTf9E5-O8xzTCA/edit?usp=sharing";


  Tabletop.init({ key: polyURL, callback: addPolygons, simpleSheet: true }); // simpleSheet assumes there is only one table and automatically sends its data 
}
window.addEventListener("DOMContentLoaded", init);

// Create a new Leaflet map centered on the Bangladesh [23.699, 89.308], 7   6/23.403/90.303

//L.map("map").setView([23.373, 90.308], 7);
var map = L.map('map', {
    fullscreenControl: {
        pseudoFullscreen: true
    } 
  }).setView([23.403, 90.303],6);

// This is the Carto Positron basemap
var hash = new L.Hash(map);

var positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
{ attribution:"&copy; Map Data <a href='https://www.iedcr.gov.bd/' target='_blank'>IEDCR</a>",
    subdomains: "abcd",
     maxZoom: 12,
    minZoom:6    
  });
positron.addTo(map);

//Zoom Comtroler
// map.zoomControl.remove();

// find my Location 
 L.control.locate().addTo(map);




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
          confirmed: data[row].lock_code,
          level: data[row].level,
        }
      });
    }
}

// The polygons are styled slightly differently on mouse hovers
var polygonStyle = { color: "#f78c72", fillColor: "#f78c72" , weight: 1.5, fillOpacity: 1};
var polygonHoverStyle = { color: "#f5eb5d", fillColor: "#f7ea2f", weight: 1.5, fillOpacity: 1};

polygonLayer = L.geoJSON(geojsonStates, {

  style: polygonStyle,

  onEachFeature: function(feature, layer) {

    layer.on({

      mouseout: function() {
        layer.setStyle({  // Need to manually set each property except `fillColor`
          color: polygonStyle.color,
          weight: polygonStyle.weight,
          fillColor: feature.fill_color,  // Use saved color
        });
        layer.closePopup();
      },

      mouseover: function() {
        layer.setStyle(polygonHoverStyle);
        layer.openPopup();
      }

    });

    let popup_html = "<div class='map-upz-lockdown-cont'>" +
      "<div class='map-upz-lockdown-name'>" +
      feature.properties.name +
      "</div>" +
      "<div class='map-upz-lockdown-level'>" +
      (feature.properties.level && (
        feature.properties.level === "Partial Locked Down"
          ? "Partial lockdown"
          : (feature.properties.level === "Full Locked Down"
            ? "Full lockdown"
            : feature.properties.level)
        )
      ) +
      "</div>" +
      "</div>";
    layer.bindPopup(popup_html);

  }

}).addTo(map);

// Set different polygon fill colors based on number of quarantined
polygonLayer.eachLayer(function (layer) {
    let d = layer.feature.properties.confirmed;
    let fc = d > 2   ? '#800026' :
          d > 1    ? '#FEB24C' :
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
  map.setMaxBounds([[19.197,86.847],[27.713,93.768]]);
}
setBounds();



// logo position: bottomright, topright, topleft, bottomleft
var logo = L.control({position: 'bottomleft'});
logo.onAdd = function(map){
var div = L.DomUtil.create('div', 'myclass');
    div.innerHTML= "<a href='https://boiledbhoot.org/' target='_blank'><img height='25px' src='../boil2.png'/></a>";
    return div;
    }
logo.addTo(map);


//Scale
// L.control.scale().addTo(map);



