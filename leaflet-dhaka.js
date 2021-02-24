
// init() is called as soon as the page loads
function init() {
  // PASTE YOUR URLs HERE
  // these URLs come from Google Sheets 'shareable link' form
  // the first is the polygon layer and the second the points
 
  var polyURL ="https://docs.google.com/spreadsheets/d/1CVAPcNM5sOUQnKv8vJ2kcSgtvq3d6AzQcdURcEWYtoQ/edit?usp=sharing";
  var hospURL ="https://docs.google.com/spreadsheets/d/1SQakzuOfO6_LGWZ0c2L0xcSRAnLPfat2EAB5mWBcPoo/edit?usp=sharing";

  Tabletop.init({ key: polyURL, callback: addPolygons, simpleSheet: true, wanted: ["map"] });
  Tabletop.init({ key: hospURL, callback: add_hospital_layer, simpleSheet: true, wanted: ["map"] });
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

let conf_num_group = L.layerGroup().addTo(map);
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
    });

      conf_num_group.addLayer(label);
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

   // Don't show name in layer list if layer is empty.
  if (polygonLayer.getLayers().length > 0 || conf_num_group.getLayers().length > 0) {
        show_map_layer_name("map_layer_conf");
    }

}

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






// var add_hospital_layer;

let hosp_layer_icon_group = L.layerGroup();

function add_hospital_layer(data) {

    for (let i = 0; i < data.length; ++i) {

        let lat_long,
            lat = parseFloat(data[i].lat),
            long = parseFloat(data[i].long);

        // Don't add marker if invalid lat-long.
        lat_long = lat && long ? [lat, long] : null;
        if (!lat_long) {
            continue;
        }

        let label_html = '<i class="map-hosp-icon glyphicon glyphicon-info-sign"></i>';
        // let label = L.marker(lat_long, {icon: L.divIcon({className: "hosp-label",html: label_html,}),
        let label = L.marker(lat_long, {icon: myIcon
        });


        let popup_html = `
            <div class="map-hosp-cont">
                <div class="map-hosp-name">
                    ${ map_lang === "bn" ? data[i].fac_name_bd : data[i].facility_name }
                </div>
                <div class="map-hosp-detail">
                   <img src="img/manw.png" alt="Man" width="15" height="17">: ${ map_lang === "bn" ? data[i].male_bn : data[i].male }<br/>
                   <img src="img/womanw.png" alt="Woman" width="15" height="17">: ${ map_lang === "bn" ? data[i].female_bn : data[i].female }<br/>
                   AEFI: ${ map_lang === "bn" ? data[i].aefi_bn : data[i].aefi }
            </div>
        `;
        label.bindPopup(popup_html);

        hosp_layer_icon_group.addLayer(label);

    }

    // Don't show name in layer list if layer is empty.
    if (hosp_layer_icon_group.getLayers().length > 0) {
        show_map_layer_name("map_layer_hospital");
    }

}

add_map_layer_name({
    input_id: "map_layer_hospital",
    text: "Vaccination map",
    input_value: "hosp",
});











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



if (map_lang === "bn") {

    document.getElementById("legend_toggler_label").innerText = "কালার কোড দেখুন";
    document.querySelector(".map-layer-conf > label").innerText = "সংক্রমণের মানচিত্র";
    document.querySelector(".map-layer-hosp > label").innerText = "টিকাদানের মানচিত্র";
}





// Remove current data layer, and add target layer. (Add/remove district labels
// as necessary.)
// Then remove "active" class from all layer names, and add it to clicked name.
function change_map_layer(el) {
    if (el.value === "hosp") {
        conf_num_group && conf_num_group.remove();
        polygonLayer && polygonLayer.remove();
        toggle_map_legend(0);
        hosp_layer_icon_group.addTo(map);

        let layers = document.querySelectorAll(".layer-switch-area > .wrap");
        for (let i = 0; i < layers.length; ++i) {
            layers[i].classList.remove("active");
        }
        el.parentNode.classList.add("active");
    } else if (el.value === "conf") {
        hosp_layer_icon_group && hosp_layer_icon_group.remove();
        toggle_map_legend(1);
        polygonLayer.addTo(map);
        conf_num_group.addTo(map);

        let layers = document.querySelectorAll(".layer-switch-area > .wrap");
        for (let i = 0; i < layers.length; ++i) {
            layers[i].classList.remove("active");
        }
        el.parentNode.classList.add("active");
    }
}










// Add a new map layer name to layer list.
function add_map_layer_name({input_id, text, input_value}) {
    let name_cont = document.createElement("div");
    name_cont.classList.add(("map-layer-" + input_value), "wrap");

    let input = document.createElement("input");
    input.setAttribute("type", "radio");
    input.setAttribute("name", "layer");
    input.id = input_id;
    input.setAttribute("value", input_value);
    input.addEventListener("change", function (e) {
        change_map_layer(e.target);
    });

    let label = document.createElement("label");
    label.setAttribute("for", input_id);
    label.innerText = text;

    name_cont.appendChild(input);
    name_cont.appendChild(label);

    let layer_switch = document.querySelector(".layer-switch-area");
    layer_switch.appendChild(name_cont);
}


var myIcon = L.icon({
    iconUrl: 'img/syringe.png',
    iconSize: [24, 24],
    iconAnchor: [22, 94],
    popupAnchor: [-3, -76],
    // shadowUrl: 'my-icon-shadow.png',
    // shadowSize: [68, 95],
    // shadowAnchor: [22, 94]
});