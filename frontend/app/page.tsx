"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "tailwindcss/tailwind.css";

const tabs = [
  { id: "zoning", label: "Urban Zoning Map" },
  { id: "carbon", label: "Carbon Footprint" },
  { id: "parking", label: "Smart Parking" },
  { id: "climate", label: "Climate Change" },
  { id: "transport", label: "Transportation" },
];

const sections = {
  zoning: {
    title: "Urban Zoning Analysis",
    description: "Interactive zoning map and land use distribution",
    metrics: [
      { title: "Residential Zones", value: "45% of total area" },
      { title: "Commercial Zones", value: "30% of total area" },
      { title: "Green Spaces", value: "25% of total area" },
    ],
    images: [
      { src: "/api/placeholder/800/450", alt: "Aerial view of urban zones", caption: "Residential District Planning" },
      { src: "/api/placeholder/800/450", alt: "Commercial zone development", caption: "Commercial Zone Analysis" },
    ],
  },
  // Add other sections in similar format
};

const UrbanPlanning = () => {
  const [activeTab, setActiveTab] = useState("zoning");
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }
    const particles = Array.from({ length: 100 }, () => new Particle());
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />
      <header className="p-6 flex justify-between items-center relative z-10">
        <div className="text-2xl font-bold">SmartCity Nexus</div>
      </header>
      <nav className="flex gap-4 overflow-x-auto px-6 py-3 relative z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-6 py-3 rounded-lg border transition ${
              activeTab === tab.id ? "bg-white/20 border-white/30" : "bg-black/70 border-white/10"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="p-6">
        {Object.entries(sections).map(([id, section]) => (
          <motion.section
            key={id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: activeTab === id ? 1 : 0, y: activeTab === id ? 0 : 20 }}
            transition={{ duration: 0.5 }}
            className={activeTab === id ? "block" : "hidden"}
          >
            <div className="p-6 bg-black/80 backdrop-blur-lg rounded-lg border border-white/10">
              <h2 className="text-3xl mb-2">{section.title}</h2>
              <p className="text-white/70 mb-4">{section.description}</p>
              <div className="grid grid-cols-2 gap-4">
                {section.images.map((img, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden aspect-[16/9]">
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform hover:scale-105" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 text-white">{img.caption}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                {section.metrics.map((metric, index) => (
                  <motion.div key={index} whileHover={{ y: -5 }} className="p-4 bg-white/10 backdrop-blur-lg rounded-lg">
                    <h3 className="text-xl">{metric.title}</h3>
                    <p>{metric.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        ))}
      </main>
      <div className="fixed bottom-6 right-6 flex gap-4 p-4 bg-black/80 backdrop-blur-lg rounded-lg border border-white/10 z-50">
        <button className="px-4 py-2 bg-white/10 rounded-lg">Export Data</button>
        <button className="px-4 py-2 bg-white/10 rounded-lg">Share</button>
      </div>
    </div>
  );
};

export default UrbanPlanning;
