"use client";
import React, { useState } from "react";

interface WeatherData {
  BASEL_temp_mean: number;
  BASEL_temp_min: number;
  BASEL_temp_max: number;
}

const WeatherApp: React.FC = () => {
  const [date, setDate] = useState<string>("");
  const [hour, setHour] = useState<string>("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setError(null);
      const response = await fetch("http://localhost:8000/predict/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          DATE: new Date(date).getDate(),
          MONTH: new Date(date).getMonth() + 1,
          BASEL_cloud_cover: 50,
          BASEL_humidity: 70,
          BASEL_pressure: 1010,
          BASEL_global_radiation: 200,
          BASEL_precipitation: 5,
          BASEL_sunshine: 4,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const data: WeatherData = await response.json();
      setWeatherData({
        BASEL_temp_mean: parseFloat(data.BASEL_temp_mean),
        BASEL_temp_min: parseFloat(data.BASEL_temp_min),
        BASEL_temp_max: parseFloat(data.BASEL_temp_max),
      });
    } catch (err) {
      setError("Failed to fetch weather data");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-200" style={{ backgroundImage: "url('/water_droplet.jpg')", backgroundSize: "cover" }}>
      <h1 className="text-3xl font-bold text-white mb-6">Weather Forecast</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <input type="date" className="w-full p-2 mb-4 border rounded" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="number" placeholder="Hour (0-23)" className="w-full p-2 mb-4 border rounded" value={hour} onChange={(e) => setHour(e.target.value)} />
        <button className="bg-blue-500 text-white w-full py-2 rounded" onClick={fetchWeather}>Get Forecast</button>
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {weatherData && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold">Predicted Weather</h2>
          <p>Mean Temp: {weatherData.BASEL_temp_mean.toFixed(1)}°C</p>
          <p>Min Temp: {weatherData.BASEL_temp_min.toFixed(1)}°C</p>
          <p>Max Temp: {weatherData.BASEL_temp_max.toFixed(1)}°C</p>
        </div>
      )}
    </div>
  );
};

export default WeatherApp;