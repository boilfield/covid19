
// init() is called as soon as the page loads
function init() {
  // PASTE YOUR URLs HERE

 
   // simpleSheet assumes there is only one table and automatically sends its data 

  var pointsURL = 'https://docs.google.com/spreadsheets/d/1B4Oyx8J_4fzuZET-kHc5RCJMAbpgk7dLOm9N5z42KUA/edit?usp=sharing';

  Tabletop.init( { key: pointsURL,
    callback: addPoints,
    simpleSheet: true } ); 

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
map.zoomControl.remove();

// find my Location 
 // L.control.locate().addTo(map);







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
    div.innerHTML= "<a href='https://boiledbhoot.org/' target='_blank'><img height='25px' src='boil2.png'/></a>";
    return div;
    }
logo.addTo(map);


//Scale
// L.control.scale().addTo(map);

var pointGroupLayer;

var geojsonStates = {
    'type': 'FeatureCollection',
    'features': []
  };



function addPoints(data) {
  if (pointGroupLayer != null) {
    pointGroupLayer.remove();
  }
  pointGroupLayer = L.layerGroup().addTo(map);

  for(var row = 0; row < data.length; row++) {
    var marker = L.marker([data[row].lat, data[row].long]).addTo(pointGroupLayer);

     marker.feature = {
      properties: {
        location: data[row].Facility_Name,
      }
    };
    marker.on({
      click: function(e) {
        L.DomEvent.stopPropagation(e);
      }
    });

    var icon = L.AwesomeMarkers.icon({
      icon: 'info-sign',
      iconColor: 'white',
      prefix: 'glyphicon',
      extraClasses: 'fa-rotate-0'
    });
    marker.setIcon(icon);
  }
}

