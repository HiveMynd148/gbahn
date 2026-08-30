import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const CustomDropdown = ({ 
  label, 
  icon: Icon, 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select option...', 
  disabled = false,
  className = '',
  size = 'md', // 'md' or 'sm'
  triggerClass = '', // Optional overrides
  disableGlass = false // Prop to disable frosted glass / backdrop blurs
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isDarkMode } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => 
    typeof opt === 'object' ? opt.value === value : opt === value
  );

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  const displayDescription = selectedOption && typeof selectedOption === 'object'
    ? selectedOption.description
    : null;

  const handleSelect = (optValue) => {
    if (disabled) return;
    onChange({ target: { value: optValue } }); // Mimic standard target event structure
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative group w-full mb-2 ${isOpen ? 'z-[60]' : 'z-10'} ${className}`}>
      {/* Bespoke Trigger Button */}
      {size === 'md' && !triggerClass ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-16 ${
            disableGlass 
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' 
              : 'bg-white/85 dark:bg-slate-900/85 backdrop-blur-[20px] border-slate-200/50 dark:border-slate-800/50'
          } rounded-xl border px-4 flex items-center justify-between transition-all duration-300 shadow-[0_0_20px_-5px_rgba(59,91,219,0.06)] dark:shadow-[0_0_25px_-5px_rgba(59,91,219,0.02)] ${
            isOpen 
              ? 'border-sapphire-500/50 shadow-[0_0_25px_-2px_rgba(59,91,219,0.18)] dark:shadow-[0_0_25px_-2px_rgba(59,91,219,0.08)] ring-2 ring-sapphire-500/10' 
              : 'hover:border-sapphire-500/30 dark:hover:border-sapphire-500/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.995]'}`}
        >
          <div className="flex items-center gap-4 min-w-0">
            {Icon && (
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0 ${
                isOpen 
                  ? 'bg-sapphire-500 text-white dark:bg-sapphire-600 dark:text-white scale-105 shadow-md shadow-sapphire-500/20' 
                  : 'bg-sapphire-50 text-sapphire-600 dark:bg-sapphire-900/30 dark:text-sapphire-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            
            <div className="flex flex-col text-left min-w-0">
              {label && (
                <span className={`text-[10px] uppercase font-black tracking-wider transition-colors duration-300 ${
                  isOpen ? 'text-sapphire-500' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {label}
                </span>
              )}
              <span className="font-semibold text-slate-900 dark:text-white text-base truncate mt-0.5">
                {displayValue}
              </span>
            </div>
          </div>
          
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-all duration-300 ease-in-out shrink-0 ml-3 ${
            isOpen ? 'rotate-180 text-sapphire-500 scale-110' : 'group-hover:text-slate-600 dark:group-hover:text-slate-350'
          }`} />
        </button>
      ) : (
        /* Small/Compact or Custom Trigger Button variant */
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between shrink-0 gap-2 ${triggerClass || 'w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all duration-200'} ${
            isOpen ? 'ring-2 ring-sapphire-500/20 border-sapphire-500/30' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}`}
        >
          <div className="flex items-center text-left min-w-0 flex-1">
            {Icon && (
              <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
            )}
            <span className="truncate">{displayValue}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 shrink-0 ml-1.5 ${isOpen ? 'rotate-180 text-sapphire-500' : ''}`} />
        </button>
      )}

      {/* Floating Bespoke Option Menu */}
      <div 
        className={`absolute left-0 right-0 mt-2 ${
          disableGlass 
            ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 shadow-xl' 
            : 'bg-white/98 dark:bg-slate-900/98 backdrop-blur-[20px] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl'
        } rounded-xl overflow-hidden z-50 transition-all duration-300 origin-top transform ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="max-h-60 overflow-y-auto py-1.5 divide-y divide-slate-100/30 dark:divide-slate-800/30">
          {options.length > 0 ? (
            options.map((opt, index) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const optDesc = typeof opt === 'object' ? opt.description : null;
              const isSelected = optValue === value;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(optValue)}
                  className={`w-full text-left px-5 py-3.5 flex items-center justify-between transition-all duration-200 group/item ${
                    isSelected 
                      ? 'bg-sapphire-50 dark:bg-sapphire-900/40 text-sapphire-600 dark:text-sapphire-400 font-semibold' 
                      : `text-slate-700 dark:text-slate-300 ${
                          disableGlass 
                            ? 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white'
                        }`
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-semibold transition-colors duration-200 ${
                      isSelected 
                        ? 'text-sapphire-600 dark:text-sapphire-400 font-bold' 
                        : `text-slate-800 dark:text-slate-200 ${
                            disableGlass 
                              ? 'group-hover/item:text-slate-900 dark:group-hover/item:text-white' 
                              : 'group-hover/item:text-slate-950 dark:group-hover/item:text-white'
                          }`
                    }`}>
                      {optLabel}
                    </span>
                    {optDesc && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider mt-0.5 truncate">
                        {optDesc}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 ml-3 animate-in zoom-in-75 duration-200" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-5 py-6 text-sm text-slate-400 italic text-center">
              No options available
            </div>
          )}
        </div>

        {/* Premium SaaS Dropdown Footer */}
        {options.length > 0 && (
          <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100/10 dark:border-slate-800/10 flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span>{options.length} options available</span>
            <span className="text-[10px] uppercase font-black text-sapphire-500 tracking-wider">Select to apply</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDropdown;
