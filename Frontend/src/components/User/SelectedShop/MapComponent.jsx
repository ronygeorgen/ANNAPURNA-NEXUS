import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';

// Replace with your actual Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
console.log('Map token: ', mapboxgl.accessToken);

const MapComponent = ({ userLocation, shopLocation }) => {
    console.log('User location full object: ', JSON.stringify(userLocation, null, 2));
    console.log('Shop location full object: ', JSON.stringify(shopLocation, null, 2));
    console.log('User latitude: ', userLocation?.latitude);
    console.log('User longitude: ', userLocation?.longitude);
    console.log('Shop latitude: ', shopLocation?.latitude);
    console.log('Shop longitude: ', shopLocation?.longitude);
    
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!userLocation.latitude || !shopLocation.latitude) return;
   
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [shopLocation.longitude, shopLocation.latitude],
      zoom: 12
    });
   
    map.current.on('load', () => {
      // Add user marker
      new mapboxgl.Marker({ color: 'blue', scale: 1.2 })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);
   
      // Add shop marker
      new mapboxgl.Marker({ color: 'red', scale: 1.2 })
        .setLngLat([shopLocation.longitude, shopLocation.latitude])
        .addTo(map.current);
   
      fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.longitude},${userLocation.latitude};${shopLocation.longitude},${shopLocation.latitude}?geometries=geojson&access_token=${mapboxgl.accessToken}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (!data.routes || data.routes.length === 0) {
            console.error('No routes found');
            return;
          }
   
          const route = data.routes[0];
          const geojson = {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          };
   
          // Remove existing route if it exists
          if (map.current.getSource('route')) {
            map.current.removeLayer('route');
            map.current.removeSource('route');
          }
   
          // Add route source and layer
          map.current.addSource('route', {
            type: 'geojson',
            data: geojson
          });
   
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#4285F4', // Blue color for shortest route
              'line-width': 8,
              'line-opacity': 1
            }
          });
   
          // Adjust map view to fit the route
          const bounds = new mapboxgl.LngLatBounds();
          route.geometry.coordinates.forEach(coord => {
            bounds.extend(coord);
          });
          map.current.fitBounds(bounds, { padding: 50 });
        })
        .catch(error => console.error('Route fetching error:', error));
    });
   }, [userLocation, shopLocation]);

  return (
    <div 
        ref={mapContainer} 
        className="w-full h-[400px] rounded-lg"
        style={{ height: '400px', width: '100%' }}
    />
);
};

export default MapComponent;