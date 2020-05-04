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
    var polyURL = "https://docs.google.com/spreadsheets/d/1vsCq5u22w6IjKXyoOWQefDcPzgf9IIRswXs4ActkziU/edit?usp=sharing";
    Tabletop.init({ key: polyURL, callback: addPolygons, simpleSheet: true });
}
window.addEventListener("DOMContentLoaded", init);



var map = L.map("map").setView([23.373, 90.308], 7);
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

var basemap = L.tileLayer(tile_url, {
    attribution: attr_html,
    subdomains: "abcd",
    maxZoom: 9,
    minZoom: 6
}); 
basemap.addTo(map);



// These are declared outisde the functions so that the functions can check if they already exist
var polygonLayer;

// The form of data must be a JSON representation of a table as returned by Tabletop.js
// addPolygons first checks if the map layer has already been assigned, and if so, deletes it and makes a fresh one
// The assumption is that the locally stored JSONs will load before Tabletop.js can pull the external data from Google Sheets
function addPolygons(data) {

    // If the layer exists, remove it and continue to make a new one with data
    if (polygonLayer != null) {
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
                }
            });
        }
    }



    document.getElementById("mst_conf_today").innerText = map_lang === "bn" ? bn_num(today_conf) : today_conf;
    document.getElementById("mst_rcov_today").innerText = map_lang === "bn" ? bn_num(today_rcov) : today_rcov;
    document.getElementById("mst_dead_today").innerText = map_lang === "bn" ? bn_num(today_dead) : today_dead;

    document.getElementById("mst_conf_total").innerText = map_lang === "bn" ? bn_num(total_conf) : total_conf;
    document.getElementById("mst_rcov_total").innerText = map_lang === "bn" ? bn_num(total_recv) : total_recv;
    document.getElementById("mst_dead_total").innerText = map_lang === "bn" ? bn_num(total_dead) : total_dead;



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



    // Set different polygon fill colors based on number
    polygonLayer.eachLayer(function (layer) {
        let d = layer.feature.properties.confirmed;

        let fc = d > 1000 ? '#800026' :
            d > 500  ? '#BD0026' :
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
        "<span>" + (map_lang === "bn" ? "১০০০+ জন" : "1000+ people") + "</span>" +
        `
        </div>
        <div>
        <span class="legend-cb" style="background-color: #BD0026"></span>
        ` +
        "<span>" + (map_lang === "bn" ? "৫০০–৯৯৯ জন" : "500-999 people") + "</span>" +
        `
        </div>
        <div>
        <span class="legend-cb" style="background-color: #E31A1C"></span>
        ` +
        "<span>" + (map_lang === "bn" ? "১০০–৪৯৯ জন" : "100-499 people") + "</span>" +
        `
        </div>
        <div>
        <span class="legend-cb" style="background-color: #FC4E2A"></span>
        ` +
        "<span>" + (map_lang === "bn" ? "৫০–৯৯ জন" : "50-99 people") + "</span>" +
        `
        </div>
        <div>
        <span class="legend-cb" style="background-color: #FD8D3C"></span>
        ` +
        "<span>" + (map_lang === "bn" ? "২০–৪৯ জন" : "20-49 people") + "</span>" +
        `
        </div>
        <div>
        <span class="legend-cb" style="background-color: #FEB24C"></span>
        ` +
        "<span>" + (map_lang === "bn" ? "১০–১৯ জন" : "10-19 people") + "</span>" +
        `
        </div>
        <div>
        <span class="legend-cb" style="background-color: #FED976"></span>
        ` +
        "<span>" + (map_lang === "bn" ? "১–৯ জন" : "1-9 people") + "</span>" +
        `
        </div></div>
        `;
    return cont_div;
}

legend.addTo(map);



let stat_table_html = `
    <table class="map-stat-table">
    <tr>
    <th id="mst_heading_status">Status</th>
    <th id="mst_heading_today">24 hr</th>
    <th id="mst_heading_total">Total</th>
    </tr>
    <tr class="mst-row-conf">
    <td id="mst_label_conf">Confirmed</td>
    <td id="mst_conf_today">0</td>
    <td id="mst_conf_total">0</td>
    </tr>
    <tr class="mst-row-rcov">
    <td id="mst_label_rcov">Recovered</td>
    <td id="mst_rcov_today">0</td>
    <td id="mst_rcov_total">0</td>
    </tr>
    <tr class="mst-row-dead">
    <td id="mst_label_dead">Dead</td>
    <td id="mst_dead_today">0</td>
    <td id="mst_dead_total">0</td>
    </tr>
    </table>
    `;

let stat_table = L.marker([21, 89], {
    icon: L.divIcon({
        className: "map-stat-table",
        html: stat_table_html,
    }),
}).addTo(map);



if (map_lang === "bn") {
    document.getElementById("mst_heading_status").innerText = "অবস্থা";
    document.getElementById("mst_heading_today").innerText = "২৪ ঘণ্টা";
    document.getElementById("mst_heading_total").innerText = "সর্বমোট";
    document.getElementById("mst_label_conf").innerText = "নিশ্চিত";
    document.getElementById("mst_label_rcov").innerText = "সুস্থ";
    document.getElementById("mst_label_dead").innerText = "মৃত";
    document.getElementById("legend_toggler_label").innerText = "কালার কোড দেখুন";
}
