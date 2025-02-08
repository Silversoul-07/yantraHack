// components/Map.tsx
"use client";
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Map() {
  const [map, setMap] = useState<L.Map | null>(null);
  const [circle, setCircle] = useState<L.Circle | null>(null);
  const [carCount, setCarCount] = useState<number>(0);

  useEffect(() => {
    const mapInstance = L.map('map').setView([20, 78], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance);

    setMap(mapInstance);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const userLocation = [position.coords.latitude, position.coords.longitude];
        mapInstance.setView(userLocation as L.LatLngExpression, 14);

        L.marker(userLocation as L.LatLngExpression)
          .addTo(mapInstance)
          .bindPopup("Your Location")
          .openPopup();

        const circleInstance = L.circle(userLocation as L.LatLngExpression, {
          radius: 500,
          color: "gray",
          fillColor: "gray",
          fillOpacity: 0.5
        }).addTo(mapInstance);

        setCircle(circleInstance);
      });
    }

    return () => {
      mapInstance.remove();
    };
  }, []);

  const checkFootprint = () => {
    if (!circle) return;

    let color = carCount <= 5 ? "green" : carCount <= 15 ? "yellow" : "red";
    circle.setStyle({ fillColor: color });
  };

  return (
    <>
      <div id="map" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 1000,
        textAlign: 'center',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)'
      }}>
        <h2>Carbon Footprint Calculator</h2>
        <label>Enter number of cars:</label>
        <input
          type="number"
          value={carCount}
          onChange={(e) => setCarCount(Number(e.target.value))}
          style={{
            padding: '10px',
            margin: '5px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
        <button
          onClick={checkFootprint}
          style={{
            padding: '10px',
            margin: '5px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            background: '#28a745',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Check Impact
        </button>
      </div>
    </>
  );
}