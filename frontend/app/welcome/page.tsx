"use client";
import React from 'react';
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  return (
    <div className="h-screen w-screen overflow-hidden relative flex items-center justify-center">
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="assets/background.webm" type="video/mp4" />
      </video>

      <div className="relative z-10 flex flex-col items-center justify-center text-white text-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-2 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-space tracking-wider animate-fade-in">
              Greetings, Innovator and Explorer!
            </h2>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-space font-bold tracking-tight">
              Welcome to SmartCity Nexus
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-space italic text-gray-200">
              Where urban dreams meet digital reality.
            </p>
          </div>

          <div className="pt-8 sm:pt-10">
            <Button 
              variant="ghost" 
              size="lg"
              className="w-48 backdrop-blur-md border-2 border-white bg-white/20 hover:bg-white/40 hover:scale-110 transition-all duration-300 text-white text-lg rounded-full"
              onClick={() => window.location.href = '/auth'}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;