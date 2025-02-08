"use client";
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Plot } from 'react-plotly.js';
import { Card } from '@/components/ui/card';

const UrbanPlanningMap = () => {
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (typeof window !== 'undefined') {
      import('leaflet-draw').then(() => {
        mapInstanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);

        drawnItemsRef.current = new L.FeatureGroup();
        mapInstanceRef.current.addLayer(drawnItemsRef.current);

        const drawControl = new L.Control.Draw({
          draw: {
            polygon: false,
            polyline: false,
            circle: false,
            marker: false,
            circlemarker: false,
            rectangle: true
          },
          edit: {
            featureGroup: drawnItemsRef.current
          }
        });

        mapInstanceRef.current.addControl(drawControl);
        mapInstanceRef.current.on(L.Draw.Event.CREATED, handleDrawCreated);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);
  const handleDrawCreated = async (event) => {
    const layer = event.layer;
    drawnItemsRef.current.clearLayers();
    drawnItemsRef.current.addLayer(layer);

    const bounds = layer.getBounds();
    const coordinates = [
      bounds.getSouthWest().lng,
      bounds.getSouthWest().lat,
      bounds.getNorthEast().lng,
      bounds.getNorthEast().lat
    ];

    try {
      const response = await fetch('http://localhost:8000/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bounds: coordinates })
      });
      const data = await response.json();
      
      if (data.error) {
        console.error("Server Error:", data.error);
        alert("Error: " + data.error);
        return;
      }

      updateGraphs(data);
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Failed to communicate with the server");
    }
  };

  const updateGraphs = (data) => {
    const { population_data, built_area_data } = data;

    if (population_data?.date && population_data?.pop) {
      const popGraphData = [{
        x: population_data.date,
        y: population_data.pop,
        type: 'line',
        line: { color: '#3B82F6' }
      }];

      const popChangeData = [{
        x: population_data.date,
        y: population_data.change,
        type: 'bar',
        marker: { color: '#10B981' }
      }];

      // Update population graphs using Plotly
      Plotly.newPlot('pop-graph', popGraphData, {
        margin: { t: 0 },
        xaxis: { title: 'Date' },
        yaxis: { title: 'Population' }
      });

      Plotly.newPlot('pop-change-graph', popChangeData, {
        margin: { t: 0 },
        xaxis: { title: 'Date' },
        yaxis: { title: 'Change (%)' }
      });
    }

    if (built_area_data?.date && built_area_data?.area) {
      const builtAreaData = [{
        x: built_area_data.date,
        y: built_area_data.area,
        type: 'line',
        line: { color: '#EF4444' }
      }];

      const builtChangeData = [{
        x: built_area_data.date,
        y: built_area_data.change,
        type: 'bar',
        marker: { color: '#F59E0B' }
      }];

      // Update built area graphs using Plotly
      Plotly.newPlot('built-area-graph', builtAreaData, {
        margin: { t: 0 },
        xaxis: { title: 'Date' },
        yaxis: { title: 'Built-up Area' }
      });

      Plotly.newPlot('built-change-graph', builtChangeData, {
        margin: { t: 0 },
        xaxis: { title: 'Date' },
        yaxis: { title: 'Change (%)' }
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Urban Planning Interactive Map</h1>
      
      <Card className="mb-6">
        <div ref={mapRef} className="h-[500px] rounded-lg" />
      </Card>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        <img
          id="landcover_img"
          alt="Land Cover"
          className="w-full md:w-4/5 max-w-[800px] rounded-lg border-2 border-gray-200"
        />
        
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 w-full md:w-[150px]">
          <h4 className="font-bold mb-2">Legend</h4>
          <div className="flex items-center mb-1">
            <span className="w-4 h-4 bg-[#1A5BAB] border border-black mr-2" />
            Residential Area
          </div>
          <div className="flex items-center mb-1">
            <span className="w-4 h-4 bg-[#358221] border border-black mr-2" />
            Public Amenities
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-[#ED022A] border border-black mr-2" />
            Industrial Area
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="text-xl font-semibold mb-2">Population Over Time</h3>
          <div id="pop-graph" className="h-[400px]" />
        </Card>

        <Card className="p-4">
          <h3 className="text-xl font-semibold mb-2">Population Change (%)</h3>
          <div id="pop-change-graph" className="h-[400px]" />
        </Card>

        <Card className="p-4">
          <h3 className="text-xl font-semibold mb-2">Built-Up Area Over Time</h3>
          <div id="built-area-graph" className="h-[400px]" />
        </Card>

        <Card className="p-4">
          <h3 className="text-xl font-semibold mb-2">Built-Up Area Change (%)</h3>
          <div id="built-change-graph" className="h-[400px]" />
        </Card>
      </div>
    </div>
  );
};

export default UrbanPlanningMap;