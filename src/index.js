/*jshint strict: false, browserify: true*/
const L = require('leaflet');
const debounce = require('lodash.debounce');
const geocodingAPIKey = 'AIzaSyA_8xlBk4KwCTQ5aDGWyvS56TwoXWM6jhQ';

require('leaflet/dist/leaflet.css');
require('./style.css');
/*
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "search"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              13.38958740234375,
              52.53794364304724
            ],
            [
              13.37860107421875,
              52.521234766555494
            ],
            [
              13.386840820312498,
              52.504519532512
            ],
            [
              13.41156005859375,
              52.49950372242746
            ],
            [
              13.4417724609375,
              52.496159531097106
            ],
            [
              13.4747314453125,
              52.504519532512
            ],
            [
              13.48846435546875,
              52.521234766555494
            ],
            [
              13.4747314453125,
              52.54462541375285
            ],
            [
              13.4527587890625,
              52.552976197007524
            ],
            [
              13.417053222656248,
              52.55130616747367
            ],
            [
              13.38958740234375,
              52.53794364304724
            ]
          ]
        ]
      }
    }
  ]
}
*/

// Agree, that's a bit quick and dirty... but...
document.body.innerHTML = `<div class="map"></div>
<div class="controls">
  <label>
    <span class="label">Meal</span>
    <input required type="text" name="address" placeholder="Weichselstrasse 6, 10247 Berlin">
    <div class="help-text"></div>
    <div class="note-multiple">Could you be a bit more precise?</div>
  </label>

  <label>
    <span class="label">Distance</span>
    <input type="range" min="1" max="3" step="0.1" name="radius">
    <div class="help-text">in kilometers</div>
  </label>

  <label>
    <span class="label">GeoJSON</span>
    <textarea name="output" readonly></textarea>
  </label>
</div>`;

const addressInput = document.querySelector('[name=address]');
const radiusInput = document.querySelector('[name=radius]');
const outputTextarea = document.querySelector('textarea');

/*
 */
const map = L.map(document.querySelector('.map')).setView([52.5247258, 13.3908442], 13);

// I use them for that test because I don't want to spend time on getting a API key at mapnik
// or make something too artsy-fartsy with Stamen tiles... (but I could)
var OSMTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

OSMTileLayer.addTo(map);

function searchAddress(address, done) {
  fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${geocodingAPIKey}
`)
    .then(res => res.json())
    .then(res => done(null, res.results))
    .catch(err => done(err));
}




function geoJsonCircle(lat, lng, radius, sides=36) {
  let i, a;
  const rad = Math.PI * 2, coords = [];
  for (i = 0; i < sides; i++) {
    a = ((rad / sides) * i) + (rad / 360);
    coords.push([
      lng + (Math.cos(a) * radius),
      lat + ((Math.sin(a) * radius) * 0.5),
    ]);
  }
  console.info('coords', coords);
  return coords;
}



function coordsGeoJSON(lat, lng) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            geoJsonCircle(lat, lng, parseFloat(radiusInput.value) * 0.01)
          ]
        }
      }
    ]
  };
}
// Weichselstrasse 6, 10247, berlin

function geojsonorgLink(geoJson) {
  return `http://geojson.io/#data=data:application/json,${encodeURIComponent(JSON.stringify(geoJson))}`;
}


function changeSearch() {
  searchAddress(addressInput.value, (err, results) => {
    if (err) throw err;

    const classList = addressInput.parentNode.classList;
    if (results.length) {
      classList.add('multiple-results');
    }
    classList.remove('multiple-results');

    const loc = results[0].geometry.location;
    console.info('loc', loc);
    // Nice one, they are no "circles" in GeoJSON... ;)
    const geoJson = coordsGeoJSON(loc.lat, loc.lng);
    const geoJsonStr = JSON.stringify(geoJson, null, 2);

    outputTextarea.value = geoJsonStr;

    L.geoJSON(geoJson, {
      style: function (feature) {
        return {};
      }
    }).addTo(map);
  });
}

addressInput.addEventListener('keyup', debounce(changeSearch, 500));
radiusInput.addEventListener('change', debounce(changeSearch, 500));

