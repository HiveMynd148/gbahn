import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

const Footer = ({ className = '' }) => {
  return (
    <footer className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-all duration-500 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Gradbahn Logo" 
              className="w-8 h-8 object-contain drop-shadow-sm" 
            />
            <span className="font-black text-xl tracking-tighter font-outfit text-slate-900 dark:text-white">
              Gradbahn
            </span>
          </div>
          
          <div className="flex space-x-6 text-slate-400">
            <a href="#" className="hover:text-sapphire-500 transition-colors"><Twitter size={20} /></a>
            <a href="#" className="hover:text-sapphire-500 transition-colors"><Linkedin size={20} /></a>
            <a href="#" className="hover:text-sapphire-500 transition-colors"><Github size={20} /></a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 font-medium">
          <p>&copy; {new Date().getFullYear()} Gradbahn Explorer. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
