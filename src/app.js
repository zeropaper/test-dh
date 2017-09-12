/*jshint strict: false, browserify: true*/
const L = require('leaflet');
const debounce = require('lodash.debounce');
const geocodingAPIKey = 'AIzaSyA_8xlBk4KwCTQ5aDGWyvS56TwoXWM6jhQ';

require('leaflet/dist/leaflet.css');
require('./style.css');


var addressInput;
var radiusInput;
var distanceElement;
var geojsonLink;
var outputTextarea;
var verifCheckbox;
var previousGeoJson;
var previousCircle;
var previousAddress;

function coordsGeoJSON(lat, lng, radius) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            geoJsonCircle(lat, lng, radius)
          ]
        }
      }
    ]
  };
}

// I've cheated a bit here
function geoJsonCircle(lat, lng, distance, sides=36) {
  let i, a, plat, plng;
  const rad = Math.PI * 2, coords = [];

  for (i = 0; i < sides; i++) {
    a = ((rad / sides) * i) + (rad / 360);
    plat = lat + (Math.sin(a) * (distance * 0.000015) * 0.62);
    plng = lng + (Math.cos(a) * (distance * 0.000015));
    coords.push([plng, plat]);
  }

  coords.push(coords[0]);
  return coords;
}

function geojsonorgURL(geoJson) {
  return `http://geojson.io/#data=data:application/json,${encodeURIComponent(JSON.stringify(geoJson))}`;
}

function drawLayers(map, lat, lng, distance) {
  // Nice one, they are no "circles" in GeoJSON... ;)
  const geoJson = coordsGeoJSON(lat, lng, distance);

  if (previousGeoJson) {
    previousGeoJson.remove();
  }
  if (previousCircle) {
    previousCircle.remove();
  }

  previousGeoJson = L.geoJSON(geoJson, {
    style: function () {
      return {
        color: 'rgb(85, 85, 85)',
        fillColor: 'rgba(85, 85, 85)',
        fillOpacity: 0.5
      };
    }
  }).addTo(map);
  map.fitBounds(previousGeoJson.getBounds());

  outputTextarea.value = JSON.stringify(geoJson, null, 2);
  geojsonLink.href = geojsonorgURL(geoJson);

  if (verifCheckbox.checked) {
    previousCircle = L.circle([lat, lng], {
      radius: distance
    }).addTo(map);
  }
  else if (previousCircle) {
    previousCircle.remove();
  }
}


function makeChangeListener(map) {
  return debounce(function() {
    const distance = Number(radiusInput.value);

    distanceElement.textContent = distance;

    if (!addressInput.value) return;

    searchAddress(addressInput.value, (err, results) => {
      if (err) throw err;

      const classList = addressInput.parentNode.classList;
      if (results.length !== 1) {
        classList.add('multiple-results');
      }
      classList.remove('multiple-results');

      const loc = results[0].geometry.location;
      drawLayers(map, loc.lat, loc.lng, distance);
    });
  }, 500);
}


function searchAddress(address, done) {
  fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${geocodingAPIKey}`)
    .then(res => res.json())
    .then(res => done(null, res.results))
    .catch(err => done(err));
}


module.exports = function() {
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
    <input type="range" min="10" max="500" step="5" value="10" name="radius">
    <div class="help-text"><span class="distance"></span> meters</div>
  </label>

  <label>
    <span class="label">GeoJSON</span>
    <textarea name="output" readonly></textarea>
    <a target="geojsonio" class="geojson-link">Open in geojson.io</a>
  </label>

  <label>
    <span class="label">Toggle verification circle</span>
    <input type="checkbox" name="verif" />
  </label>
</div>`;

  addressInput = document.querySelector('[name=address]');
  radiusInput = document.querySelector('[name=radius]');
  verifCheckbox = document.querySelector('[name=verif]');
  distanceElement = document.querySelector('.distance');
  geojsonLink = document.querySelector('.geojson-link');
  outputTextarea = document.querySelector('textarea');

  const map = L.map(document.querySelector('.map'), {
    center: [52.5247258, 13.3908442],
    zoom: 13,
    zoomControl: false
  });

  L.control.scale({
    position: 'bottomright'
  }).addTo(map);

  L.control.zoom({
    position: 'topright'
  }).addTo(map);


  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);


  const changeListener = makeChangeListener(map);
  addressInput.addEventListener('keyup', changeListener);
  radiusInput.addEventListener('change', changeListener);
  verifCheckbox.addEventListener('change', changeListener);
  //
  addressInput.value = 'Weichselstrasse 6, 10247 Berlin';
  changeListener();
};


