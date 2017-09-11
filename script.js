(function() {
'use strict';
/*global L: false*/

// geocoding key


const addressInput = document.querySelector('[name=address]');
const radiusInput = document.querySelector('[name=radius]');
const outputTextarea = document.querySelector('textarea');

const map = L.map(document.querySelector('.map')).setView([52.5247258, 13.3908442], 13);

// I use them for that test because I don't want to spend time on getting a API key at mapnik
// or make something too artsy-fartsy with Stamen tiles... (but I could)
var OSMTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

OSMTileLayer.addTo(map);

console.info(map);

})();