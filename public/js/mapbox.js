/* eslint-disable */

// the locations are being read from the data in the html loaded
const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoibHlwemlzIiwiYSI6ImNrYnpqMHhseTBkMXgycW8xdHZzcTFrd3UifQ.IXJy9TB-oBaysLEZv6B_Pw';

const map = new mapboxgl.Map({
  container: 'map', // this is an element id required
  style: 'mapbox://styles/lypzis/ckbzjbewt0qhs1ipb610shmnq',
  scrollZoom: false
  //   center: [-118.113491, 34.111745],
  //   zoom: 10,
  //   interactive: false
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(location => {
  // Create marker
  const el = document.createElement('div'); // check mozilla dev for 'createElement' :D
  el.className = 'marker'; // there is a 'marker' class specified in the css file

  // Add Marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom'
  })
    .setLngLat(location.coordinates)
    .addTo(map);

  // Add popup
  new mapboxgl.Popup({
    offset: 30
  })
    .setLngLat(location.coordinates)
    .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
    .addTo(map);

  // Extend map bounds to include current location
  bounds.extend(location.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100
  }
});
