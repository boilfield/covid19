let total_conf = 0;
let total_recv = 0;
let total_dead = 0;

let today_conf = 0;
let today_rcov = 0;
let today_dead = 0;


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
var map = L.map("map").setView([23.373, 90.308], 7);

// This is the Carto Positron basemap
var hash = new L.Hash(map);

var basemap = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  // "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      "&copy; Map Data <a href='https://www.iedcr.gov.bd/' target='_blank'>IEDCR</a>",
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
      total_conf += parseInt(data[row].cases);
      total_recv += parseInt(data[row].rcov);
      total_dead += parseInt(data[row].death);
      today_conf += parseInt(data[row].todayconf);
      today_rcov += parseInt(data[row].todayrcov);
      today_dead += parseInt(data[row].todaydeath);
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
          image: data[row].image,
          tocon: data[row].tocon,

        }
      });
    }
  }

  document.getElementById("mst_conf_today").innerText = today_conf;
  document.getElementById("mst_rcov_today").innerText = today_rcov;
  document.getElementById("mst_dead_today").innerText = today_dead;

  document.getElementById("mst_conf_total").innerText = total_conf;
  document.getElementById("mst_rcov_total").innerText = total_recv;
  document.getElementById("mst_dead_total").innerText = total_dead;

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

        }
      });

      var html = (map_lang === "bn" ? "নিশ্চিত: <b>" : 'Confirmed: <b>') + feature.properties.confirmed + '</b><br/>';
      html += (map_lang === "bn" ? "সুস্থ: <b>" : 'Recovered: <b>') + feature.properties.recover + '</b><br/>';
      html += (map_lang === "bn" ? "মৃত: <b>" : 'Death: <b>') + feature.properties.deaths + '</b><br/>';
      html += '<h6 class="more-button">' + (feature.properties.web && map_lang === "bn" ? "<a href='../dhaka.html' target='_blank'>বিস্তারিত তথ্য</a>" : feature.properties.web) +'</h6>';
      layer.bindPopup(html);

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
    let fc = d > 1000 ? '#800026' :
          d > 500  ? '#BD0026' :
          // d > 200  ? '#E31A1C' :
          d > 100  ? '#E31A1C' :
          d > 50   ? '#FC4E2A' :
          d > 20   ? '#FD8D3C' :
          d > 10   ? '#FEB24C' :
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
  map.setMaxBounds([[19.197,86.847],[27.713,93.768]]);
}
setBounds();


    //logo position: bottomright, topright, topleft, bottomleft
    var logo = L.control({position: 'bottomleft'});
    logo.onAdd = function(map){
        var div = L.DomUtil.create('div', 'myclass');
        div.innerHTML= "<a href='https://boiledbhoot.org/' target='_blank'>Powered and maintained by <img height='25px' src='" + (map_lang === "bn" ? "../boil.png" : "boil.png") + "'/></a>";
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
  cont_div.innerHTML = "<div><b>" + (map_lang === "bn" ? "নিশ্চিত কেসের সংখ্যা" : "Confirmed Cases") + "</b></div>" +
    `
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
    ` +
      "<span>" + (map_lang === "bn" ? "১০০০+ জন" : "1000+ people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #BD0026"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "৫০০-৯৯৯ জন" : "500-999 people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #E31A1C"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "১০০-৪৯৯ জন" : "100-499 people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FC4E2A"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "৫০-৯৯ জন" : "50-99 people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FD8D3C"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "২০-৪৯ জন" : "20-49 people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FEB24C"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "১০-১৯ জন" : "10-19 people") + "</span>" +
    `
    </div>
    <div>
      <span class="legend-cb" style="background-color: #FED976"></span>
    ` +
      "<span>" + (map_lang === "bn" ? "১-৯ জন" : "1-9 people") + "</span>" +
    `
    </div>
  `;
  return cont_div;
}
legend.addTo(map);

let stat_table_html = `
    <table class="map-stat-table">
      <tr>
        <th>Status</th>
        <th>Today</th>
        <th>Total</th>
      </tr>
      <tr class="mst-row-conf">
        <td>Confirmed</td>
        <td id="mst_conf_today">0</td>
        <td id="mst_conf_total">0</td>
      </tr>
      <tr class="mst-row-rcov">
        <td>Recovered</td>
        <td id="mst_rcov_today">0</td>
        <td id="mst_rcov_total">0</td>
      </tr>
      <tr class="mst-row-dead">
        <td>Dead</td>
        <td id="mst_dead_today">0</td>
        <td id="mst_dead_total">0</td>
      </tr>
    </table>
`;

let stat_table = L.marker([21, 88.75], {
    icon: L.divIcon({
        className: "map-stat-table",
        html: stat_table_html,
    }),
}).addTo(map);
