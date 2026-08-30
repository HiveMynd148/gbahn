import { Link } from 'react-router-dom';
import { Search, Bell, BookOpen } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

const HeaderBrandmark = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-all duration-500 animate-fade-in">
      <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <Link to="/" className="flex items-center space-x-3 group cursor-pointer">
          <img 
            src="/logo.png" 
            alt="Gradbahn Logo" 
            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform drop-shadow-md" 
          />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit transition-colors duration-500">
            Grad<span className="text-sapphire-500">bahn</span>
          </span>
        </Link>

        {/* Minimal Utility Section */}
        <div className="flex items-center space-x-6">
          {/* Low-profile Search (Desktop) */}
          <div className="hidden md:flex items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-full px-4 py-1.5 focus-within:ring-2 ring-sapphire-500/20 transition-all duration-500 w-64 group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-sapphire-500 transition-colors duration-500" />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="bg-transparent border-none focus:ring-0 text-sm text-slate-600 dark:text-slate-300 placeholder:text-slate-400 ml-2 w-full transition-colors duration-500"
            />
          </div>

          {/* Indicators */}
          <div className="flex items-center space-x-3">
            <Link 
              to="/documentation" 
              className="p-2 text-slate-400 dark:text-slate-300 hover:text-sapphire-500 dark:hover:text-sapphire-400 hover:bg-sapphire-50 dark:hover:bg-sapphire-900/20 rounded-full transition-all duration-500 group"
              title="Academic Guide"
            >
              <BookOpen className="w-5 h-5 transition-transform group-hover:scale-110" />
            </Link>

            {/* Shared Theme Toggle Component */}
            <div className="flex items-center scale-90 transition-transform hover:scale-95 active:scale-90">
              <ThemeToggle />
            </div>

            <button className="relative p-2 text-slate-400 dark:text-slate-300 hover:text-sapphire-500 dark:hover:text-sapphire-400 hover:bg-sapphire-50 dark:hover:bg-sapphire-900/20 rounded-full transition-all duration-500 group">
              <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-gold-500 rounded-full border-2 border-white dark:border-slate-900 transition-all duration-500"></span>
            </button>
            
            {/* System Status Dot */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/10 rounded-full border border-emerald-100 dark:border-emerald-800/30 transition-all duration-500">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default HeaderBrandmark;


