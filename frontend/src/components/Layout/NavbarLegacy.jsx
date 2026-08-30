import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

const NavbarLegacy = () => {
  const { isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Programmes', path: '/programmes' },
    { name: 'Calculator', path: '/calculator' },
    // { name: 'Info', path: '/documentation' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg py-3'
        : 'bg-transparent py-5'
      }`}>
      <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/logo.png"
              alt="Gradbahn Logo"
              className="w-10 h-10 object-contain group-hover:rotate-6 transition-transform"
            />
            <span className={`text-2xl font-bold tracking-tight font-outfit ${scrolled || location.pathname !== '/' ? 'text-slate-900 dark:text-white' : 'text-white'
              }`}>
              Grad<span className="text-sapphire-500">bahn</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-bold tracking-wide transition-colors hover:text-sapphire-500 ${location.pathname === link.path
                    ? 'text-sapphire-500'
                    : (scrolled || location.pathname !== '/' ? 'text-slate-600 dark:text-slate-300' : 'text-white/90')
                  }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center">
              <ThemeToggle />
            </div>
            <Link
              to="/login"
              className="bg-sapphire-500 hover:bg-sapphire-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-sapphire-500/25 transition-all hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <div className="mr-4 scale-75 origin-right">
              <ThemeToggle />
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${scrolled || location.pathname !== '/' ? 'text-slate-600 dark:text-slate-300' : 'text-white'}`}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-0 left-0 w-full h-screen bg-slate-900 z-50 flex flex-col p-8 animate-fade-in">
          <div className="flex justify-between items-center mb-12">
            <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Gradbahn Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-2xl font-bold text-white font-outfit">Gradbahn</span>
            </Link>
            <button onClick={() => setIsOpen(false)} className="text-white">
              <X size={32} />
            </button>
          </div>

          <div className="flex flex-col space-y-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-3xl font-bold text-white hover:text-sapphire-400 transition-colors flex items-center justify-between group"
              >
                {link.name}
                <ChevronRight className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="mt-8 bg-gold-500 text-slate-900 text-center py-4 rounded-2xl font-black text-xl shadow-xl shadow-gold-500/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarLegacy;
