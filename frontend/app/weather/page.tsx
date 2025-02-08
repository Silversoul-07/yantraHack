"use client";
import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Cloud, Sun, CloudRain, CloudSun, Pencil } from "lucide-react";

interface WeatherData {
  BASEL_temp_mean: number;
  BASEL_temp_min: number;
  BASEL_temp_max: number;
}

const WeatherApp: React.FC = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hour, setHour] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [randomMetrics, setRandomMetrics] = useState({
    uv: 0,
    wind: 0,
    humidity: 0,
    airQuality: 0,
    weatherIcon: 0
  });

  useEffect(() => {
    updateRandomMetrics();
  }, [weatherData]);

  const updateRandomMetrics = () => {
    setRandomMetrics({
      uv: Math.floor(Math.random() * 11),
      wind: Math.floor(Math.random() * 30),
      humidity: Math.floor(Math.random() * 100),
      airQuality: Math.floor(Math.random() * 300),
      weatherIcon: Math.floor(Math.random() * 4)
    });
  };

  const getWeatherIcon = () => {
    switch(randomMetrics.weatherIcon) {
      case 0: return <Sun size={64} className="text-yellow-400" />;
      case 1: return <Cloud size={64} className="text-gray-400" />;
      case 2: return <CloudRain size={64} className="text-blue-400" />;
      default: return <CloudSun size={64} className="text-yellow-400" />;
    }
  };

  const getAirQualityText = (value: number) => {
    if (value <= 50) return "Good";
    if (value <= 100) return "Moderate";
    if (value <= 150) return "Unhealthy for Sensitive Groups";
    return "Unhealthy";
  };

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

      if (!response.ok) throw new Error("Failed to fetch weather data");
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

  const chartData = weatherData ? [
    { name: 'Min', temp: weatherData.BASEL_temp_min },
    { name: 'Avg', temp: weatherData.BASEL_temp_mean },
    { name: 'Max', temp: weatherData.BASEL_temp_max }
  ] : [];

  return (
    <div className="min-h-screen bg-[#E3F2FD]">
      <div className="flex h-screen">
        <div className="w-1/4 bg-gradient-to-b from-[#74B9FF] to-[#0984E3] text-white p-5 flex flex-col justify-center items-center">
          <h1 className="text-2xl mb-8">Weather Dashboard</h1>
           
          <div className="text-center flex flex-col items-center">
            {getWeatherIcon()}
            <h2 className="text-5xl font-bold my-4">{weatherData?.BASEL_temp_mean || '--'}°C</h2>
            <p className="text-xl mb-2 opacity-90">Partly Cloudy</p>
            <div className="flex items-center">
              <p className="text-lg opacity-75">Vellore, IN</p>
              <button onClick={() => setIsEditing(!isEditing)} className="ml-2 p-1 hover:bg-blue-600 rounded-full">
                <Pencil size={16} />
              </button>
            </div>
          </div>
        </div>
  
        <div className="w-3/4 p-8 flex flex-col">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 flex-grow">
            <div className="mb-6">
              {isEditing && (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border p-2 rounded-lg mr-3"
                />
              )}
              <button
                onClick={fetchWeather}
                className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-6 py-2 rounded-lg font-medium"
              >
                Fetch Weather
              </button>
            </div>
            {weatherData && (
              <div className="h-full">
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="name"
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                      unit="°C"
                    />
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: '#fff' }}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                    />
                  </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-6 mt-auto">
          {[
            { title: "UV Index", value: `${randomMetrics.uv}` },
            { title: "Wind Status", value: `${randomMetrics.wind} km/h WSW` },
            { title: "Humidity", value: `${randomMetrics.humidity}%` },
            { title: "Air Quality", value: `${randomMetrics.airQuality} (${getAirQualityText(randomMetrics.airQuality)})` }
          ].map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg text-center transition-transform hover:scale-105">
              <h3 className="font-bold text-gray-600 mb-3">{metric.title}</h3>
              <p className="text-2xl font-semibold text-gray-800">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};
export default WeatherApp;                