"use client";
import { useState } from "react";
import { FaUserCircle } from 'react-icons/fa';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isLogin ? 'http://localhost:8000/token' : 'http://localhost:8000/user';
      const formBody = new FormData();
      
      if (!isLogin) {
        formBody.append('name', formData.name);
      }
      formBody.append('username', formData.username);
      formBody.append('password', formData.password);

      const response = await fetch(url, {
        method: 'POST',
        body: formBody,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      if (isLogin) {
        // Handle successful login
        window.location.href = '/loading';
      } else {
        // Switch to login after successful registration
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen relative">
      {/* Video Background with Gradient Overlay */}
      <div className="absolute inset-0">
        <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
          <source src="assets/Login.webm" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-transparent"></div>
      </div>

      {/* Auth Container */}
      <div className="relative w-full max-w-md mx-4 p-8 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <FaUserCircle className="mx-auto text-6xl text-white/90 mb-4" />
          <h1 className="font-bold text-3xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            SmartCity Nexus
          </h1>
          <h2 className="text-xl text-white/90 mt-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-white text-sm">
            {error}
          </div>
        )}

<form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Full Name</label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                placeholder="Enter your name"
                required 
              />
            </div>
          )}

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">Email</label>
            <input 
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
              placeholder="Enter your email"
              required 
            />
          </div>

          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">Password</label>
            <input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
              placeholder="Enter your password"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="mt-6 text-center text-white/80">
          {isLogin ? "New to SmartCity Nexus?" : "Already have an account?"} 
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-white hover:text-white/80 underline underline-offset-2 transition-colors"
          >
            {isLogin ? "Create Account" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;