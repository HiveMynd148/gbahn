import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative w-14 h-7 rounded-full overflow-hidden transition-all duration-700 ease-in-out transform hover:scale-105 active:scale-95 focus:outline-none group shadow-md"
      aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {/* Background Layers */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out bg-gradient-to-br from-[#74b9ff] to-[#a29bfe] ${
          isDarkMode ? 'opacity-0' : 'opacity-100'
        }`} 
      />
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out bg-gradient-to-br from-[#1a2b5e] to-[#0f172a] ${
          isDarkMode ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* Clouds (Light Mode) */}
      <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${isDarkMode ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        <div className="absolute top-1 right-2 w-3 h-3 bg-white/80 rounded-full blur-[1px]" />
        <div className="absolute top-3 right-1 w-4 h-4 bg-white/60 rounded-full blur-[1px]" />
        <div className="absolute top-4 right-4 w-2 h-2 bg-[#e1f5fe]/70 rounded-full blur-[1px]" />
      </div>

      {/* Stars & Hill (Dark Mode) */}
      <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${isDarkMode ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
        {/* Stars */}
        <div className="absolute top-1 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse" />
        <div className="absolute top-3 left-6 w-0.5 h-0.5 bg-white rounded-full opacity-60" />
        <div className="absolute top-4 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Hill */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#020617] rounded-[100%_100%_0_0]" />
      </div>

      {/* Knob (Sun/Moon) */}
      <div 
        className={`absolute top-1 bottom-1 w-5 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${
          isDarkMode ? 'left-[32px]' : 'left-1'
        }`}
      >
        <div className="relative w-5 h-5 rounded-full shadow-inner overflow-hidden">
          {/* Sun */}
          <div 
            className={`absolute inset-0 bg-[#fcc419] transition-all duration-700 ${
              isDarkMode ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'
            } shadow-[0_0_8px_rgba(252,196,25,0.6)] flex items-center justify-center`}
          >
             {/* Sun Rays */}
             <div className="absolute inset-0 border border-[#fcc419] border-dashed rounded-full animate-[spin_10s_linear_infinite]" />
          </div>

          {/* Moon */}
          <div 
            className={`absolute inset-0 bg-[#f1f5f9] transition-all duration-700 ${
              isDarkMode ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
            } shadow-[0_0_8px_rgba(241,245,249,0.4)]`}
          >
            {/* Craters */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-[#cbd5e1]/40 rounded-full" />
            <div className="absolute top-3 left-3 w-1 h-1 bg-[#cbd5e1]/30 rounded-full" />
          </div>
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
