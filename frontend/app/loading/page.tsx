'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [video2Visible, setVideo2Visible] = useState(false);

  useEffect(() => {
    if (loading) {
      let progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 12;
        });
      }, 1000);
    }
  }, [loading]);

  const handleGetStarted = () => {
    setLoading(true);
    setTimeout(() => {
      setVideo2Visible(true);
    }, 500);
  };

  return (
    <div className="relative w-full h-screen flex justify-center items-center bg-black text-white overflow-hidden">
      {/* Background Video */}
      <video
        className={cn('absolute top-0 left-0 w-full h-full object-cover transition-opacity', {
          'opacity-0': video2Visible,
        })}
        autoPlay
        loop
        muted
        src="/assets/video1.webm"
      />

      {/* Second Video */}
      {video2Visible && (
        <video
          className="absolute top-0 left-0 w-full h-full object-cover transition-opacity opacity-100"
          autoPlay
          onEnded={() => (window.location.href = '/')}
          src="/assets/earth-zoom.webm"
        />
      )}

      {/* Get Started Button */}
      {!loading && (
        <Button
          onClick={handleGetStarted}
          className="absolute px-6 py-3 text-lg font-bold uppercase border-2 border-white text-white bg-white/20 rounded-full backdrop-blur-md hover:bg-white/40 transition-transform scale-100 hover:scale-110"
        >
          Get Started
        </Button>
      )}

      {/* Progress Bar */}
      {loading && progress < 100 && (
        <div className="absolute flex flex-col items-center">
          <span className="text-lg font-bold text-orange-500 mb-2">Loading...</span>
          <div className="w-72 h-3 bg-white/30 rounded-full overflow-hidden shadow-md">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}