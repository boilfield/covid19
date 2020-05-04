
// init() is called as soon as the page loads
function init() {
  // PASTE YOUR URLs HERE
  // these URLs come from Google Sheets 'shareable link' form
  // the first is the polygon layer and the second the points
 
  var polyURL =
    "https://docs.google.com/spreadsheets/d/1CVAPcNM5sOUQnKv8vJ2kcSgtvq3d6AzQcdURcEWYtoQ/edit?usp=sharing";

  Tabletop.init({ key: polyURL, callback: addPolygons, simpleSheet: true });
  // Tabletop.init({ key: pointsURL, callback: addPoints, simpleSheet: true }); // simpleSheet assumes there is only one table and automatically sends its data
}
window.addEventListener("DOMContentLoaded", init);

// Create a new Leaflet map centered on the continental US [23.699, 89.308], 7
var map = L.map("map").setView([23.7926, 90.4175], 11);

// This is the Carto Positron basemap
var hash = new L.Hash(map);

let attr_html = "&copy;" +
  (map_lang === "bn" ? " মানচিত্রের তথ্যের উৎস: " : " Map Data courtesy: ") +
  "<a href='https://www.iedcr.gov.bd/' target='_blank'>" +
  (map_lang === "bn" ? "আইইডিসিআর" : "IEDCR") +
  "</a>, " +
  "<a href='https://osm.org/' target='_blank'>" +
  (map_lang === "bn" ? "ওপেনস্ট্রিটম্যাপ" : "OpenStreetMap") +
  "</a>";
var basemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
{ attribution: attr_html,
    subdomains: "abcd",
     maxZoom: 15,
    minZoom:11    
  });
basemap.addTo(map);

//Zoom Comtroler
map.zoomControl.remove();




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
          name: map_lang==="bn" ? data[row].name_bd : data[row].name,
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
        },
        mouseover: function(e) {
          e.target.setStyle(polygonHoverStyle);
        }
      });

      var html = (map_lang === "bn" ? ("নিশ্চিত: <b>" + bn_num(feature.properties.confirmed)) : ('Confirmed: <b>' + feature.properties.confirmed)) + '</b><br/>';
      html += (map_lang === "bn" ? ("সুস্থ: <b>" + bn_num(feature.properties.recover)) : ('Recovered: <b>' + feature.properties.recover)) + '</b><br/>';
      html += (map_lang === "bn" ? ("মৃত: <b>" + bn_num(feature.properties.deaths)) : ('Death: <b>' + feature.properties.deaths)) + '</b><br/>';
      html += '<h6 class="more-button">' + (!feature.properties.web ? "" : (map_lang === "bn" ? "<a href='dhaka.html' target='_blank'>বিস্তারিত তথ্য</a>" : "<a href='../dhaka.html' target='_blank'>Details</a>")) +'</h6>';
      layer.bindPopup(html);

      let dist_label_html = "<div class='map-dist-label-cont'>" +
        "<div class='map-dist-label-name'>" +
        feature.properties.name +
        "</div>" +
        "<div class='map-dist-label-num'>" +
        (map_lang === "bn" ? bn_num(feature.properties.confirmed) : feature.properties.confirmed) +
        "</div></div>";

      let label = L.marker(layer.getBounds().getCenter(), {
      icon: L.divIcon({
        className: 'label',
        html: dist_label_html,
      })
    }).addTo(map);
    },
    style: polygonStyle
  }).addTo(map);



  // Set different polygon fill colors based on number of quarantined
  polygonLayer.eachLayer(function (layer) {
    let d = layer.feature.properties.confirmed;
    let fc = d > 500 ? '#800026' :
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
    let credit_html = "<a href='https://boiledbhoot.org/' target='_blank'>" +
      (map_lang === "bn" ? "নির্মাণ ও তত্ত্বাবধানে" : "Powered and maintained by") +
      "<img class='credit-logo' height='25px' src='" +
      (map_lang === "bn" ? "boil.png" : "../boil.png")
      + "'/></a>";
    logo.onAdd = function(map){
        var div = L.DomUtil.create('div', 'credit');
        div.innerHTML= credit_html;
        return div;
    }
    logo.addTo(map);



let legend = L.control({position: "bottomright"});
legend.onAdd = function (map) {
  let cont_div = L.DomUtil.create('div', 'info legend');
  cont_div.innerHTML = "<div id='legend_toggler' class='legend-toggler'></div>" +
    "<div id='legend_toggler_label' class='legend-toggler-label'><div>Show color codes</div></div>" +
    "<div class='legend-cont'><div><b>" + (map_lang === "bn" ? "নিশ্চিত কেসের সংখ্যা" : "Confirmed Cases") + "</b></div>" +
    `
    <div>
      <span class="legend-cb" style="background-color: #800026"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "৫০০+ জন" : "500+ people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #BD0026"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "১০১–৪৯৯ জন" : "101-499 people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FC4E2A"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "৫১–১০০ জন" : "51-100 people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FD8D3C"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "২১–৫০ জন" : "21-50 people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FED976"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "১–২০ জন" : "1-20 people") + "</span>" +
    `
    </div></div>
  `;
  return cont_div;
}
legend.addTo(map);

if (map_lang === "bn") {
  document.getElementById("legend_toggler_label").innerText = "কালার কোড দেখুন";
}
