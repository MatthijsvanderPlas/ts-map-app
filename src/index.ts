import axios, { HttpStatusCode } from 'axios';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import './app.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoibWF0dGhpanN2YW5kZXJwbGFzZGV2IiwiYSI6ImNsY2t6dWhnZjBrdGwzc21xdmJ1aTd5MHEifQ.qrB5L15Y8cEuaF3VA1WLyg';

type ResponseObject = {
  features: {
    bbox: number[];
    geometry: {
      type: string;
      coordinates: [number, number];
    };
    properties: {
      address: {
        city: string;
        country: string;
        postcoe: string;
        state: string;
      };
      display_name: string;
      osm_id: number;
      place_id: number;
    };
  }[];
};

type NominatimGeocodingResponse = {
  data: ResponseObject;
  status: HttpStatusCode;
};

const form = document.querySelector('form')!;
const addressInput = document.getElementById('address')! as HTMLInputElement;

function searchAddressHandler(event: Event) {
  event.preventDefault();
  const enteredAddress = addressInput.value;

  axios
    .get<HttpStatusCode, NominatimGeocodingResponse>(
      `https://nominatim.openstreetmap.org/search?format=geojson&addressdetails=1&limit=1&polygon_svg=1&q=${encodeURI(
        enteredAddress
      )}`
    )
    .then((response) => {
      if (response.status !== HttpStatusCode.Ok) {
        throw new Error('Could not fetch location!');
      }
      document.getElementById('map')!.innerHTML = '';
      const coordinates = response.data.features[0].geometry.coordinates;

      const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/streets-v11', // style URL
        center: coordinates, // starting position [lng, lat]
        zoom: 17, // starting zoom
      });

      new mapboxgl.Marker().setLngLat(coordinates).addTo(map);

      map.on('load', () => {

        const layers = map.getStyle().layers;
      
        map.addLayer({
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
  
            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height'],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height'],
            ],
            'fill-extrusion-opacity': 0.6,
          },
        });
      })
    })
    .catch((err) => console.log(err));
}

form.addEventListener('submit', searchAddressHandler);
