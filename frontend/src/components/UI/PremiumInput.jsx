import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const PremiumInput = ({ label, icon: Icon, value, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const { isDarkMode } = useTheme();
  const hasValue = value && value.length > 0;

  // Determine colors for autofill and standard text
  const textColor = isDarkMode ? '#ffffff' : '#0f172a';
  const focusColor = isDarkMode ? '#fbbf24' : '#3b5bdb'; // Gold in dark, Sapphire in light

  return (
    <div className="relative group w-full mb-2">
      {/* Dynamic Focus Glow */}
      <div 
        className={`absolute -inset-1 bg-gradient-to-r from-sapphire-500/20 to-indigo-500/20 rounded-2xl blur-lg opacity-0 transition-opacity duration-500 ${
          isFocused ? 'opacity-100' : ''
        }`}
      ></div>
      
      <div className={`relative flex items-center bg-white/40 dark:bg-slate-900/60 backdrop-blur-md border-2 rounded-2xl transition-all duration-300 overflow-hidden ${
        isFocused 
          ? 'border-sapphire-500 shadow-[0_0_20px_rgba(59,91,219,0.1)]' 
          : 'border-slate-200/60 dark:border-slate-700/40 hover:border-slate-300 dark:hover:border-slate-600'
      }`}>
        
        {/* Icon - Moved to absolute position to allow input to span full width for autofill */}
        {Icon && (
          <div className={`absolute left-5 z-20 pointer-events-none transition-all duration-300 ${
            isFocused ? 'text-sapphire-500 scale-110' : 'text-slate-400'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <div className="relative flex-1">
          <style dangerouslySetInnerHTML={{ __html: `
            input:-webkit-autofill,
            input:-webkit-autofill:hover, 
            input:-webkit-autofill:focus, 
            input:-webkit-autofill:active {
              -webkit-transition: background-color 5000s ease-in-out 0s;
              transition: background-color 5000s ease-in-out 0s;
              -webkit-text-fill-color: ${isFocused ? focusColor : textColor} !important;
              caret-color: ${focusColor};
            }
          `}} />
          <input
            {...props}
            value={value}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full pl-14 pr-6 pt-7 pb-2 bg-transparent text-slate-900 dark:text-white outline-none transition-all duration-300 placeholder-transparent peer rounded-2xl relative z-10"
            style={{ color: isDarkMode ? '#ffffff' : '#0f172a' }}
          />
          
          <label 
            className={`absolute left-14 transition-all duration-300 pointer-events-none uppercase font-black tracking-[0.15em] z-20 ${
              isFocused || hasValue 
                ? 'top-2 text-[10px] text-sapphire-500 opacity-100 translate-y-0' 
                : 'top-1/2 -translate-y-1/2 text-xs text-slate-400 opacity-60'
            }`}
          >
            {label}
          </label>
        </div>
      </div>
    </div>
  );
};

export default PremiumInput;
