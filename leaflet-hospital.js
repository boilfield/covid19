
// init() is called as soon as the page loads
function init() {
    // PASTE YOUR URLs HERE
    // simpleSheet assumes there is only one table and automatically sends its data 
    var pointsURL = 'https://docs.google.com/spreadsheets/d/1B4Oyx8J_4fzuZET-kHc5RCJMAbpgk7dLOm9N5z42KUA/edit?usp=sharing';
    Tabletop.init({ key: pointsURL, callback: addPoints, simpleSheet: true }); 

}
window.addEventListener("DOMContentLoaded", init);


var map = L.map('map').setView([23.403, 90.303],6);
map.zoomControl.remove();

var hash = new L.Hash(map);

let tile_url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

let attr_html = "&copy;" +
    (map_lang === "bn" ? " মানচিত্রের তথ্যের উৎস: " : " Map Data courtesy: ") +
    "<a href='https://www.iedcr.gov.bd/' target='_blank'>" +
    (map_lang === "bn" ? "আইইডিসিআর" : "IEDCR") +
    "</a>, " +
    "<a href='https://osm.org/' target='_blank'>" +
    (map_lang === "bn" ? "ওপেনস্ট্রিটম্যাপ" : "OpenStreetMap") +
    "</a>";

var base_map = L.tileLayer(tile_url, {
    attribution: attr_html,
    subdomains: "abcd",
    maxZoom: 12,
    minZoom: 6
});
base_map.addTo(map);



//bound box
var bounds_group = new L.featureGroup([]);
function setBounds() {
    if (bounds_group.getLayers().length) {
        map.fitBounds(bounds_group.getBounds());
    }
    map.setMaxBounds([[19.197,86.847],[27.713,93.768]]);
}
setBounds();



//Possible logo positions: bottomright, topright, topleft, bottomleft
var logo = L.control({position: 'bottomleft'});

let credit_html = "<a href='https://boiledbhoot.org/' target='_blank'>" +
    (map_lang === "bn" ? "নির্মাণ ও তত্ত্বাবধানে" : "Powered and maintained by") +
    "<img class='credit-logo' height='25px' src='" +
    (map_lang === "bn" ? "boil.png" : "../boil.png")
    + "'/></a>" +
    "&nbsp;" +
    "<a href='https://osmbdf.org/' target='_blank'>" +
    (map_lang === "bn" ? "সহযোগিতায়" : "Supported by") +
    "<img class='credit-logo' height='24px' src='" +
    (map_lang === "bn" ? "img/logo_osmbdf.png" : "../img/logo_osmbdf.png")
    + "'/></a>";

logo.onAdd = function(map){
    var div = L.DomUtil.create('div', 'credit');
    div.innerHTML= credit_html;
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

