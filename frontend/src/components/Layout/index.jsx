import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import HeaderBrandmark from './HeaderBrandmark';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Layout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      
      {/* Top Section */}
      {isAuthenticated ? (
        <HeaderBrandmark />
      ) : (
        <Navbar /> // This will render NavbarLegacy for guests
      )}

      {/* Main Content Area */}
      <main className={`flex-grow transition-all duration-500 ${
        isAuthenticated 
          ? 'pt-16 pb-32' // Space for HeaderBrandmark (top) and NavigationIsland (bottom)
          : (isHomePage || location.pathname === '/login' || location.pathname === '/register' ? 'pt-0' : 'pt-20 lg:pt-24') // Traditional padding for NavbarLegacy
      }`}>
        <Outlet />
      </main>

      {/* Bottom Section */}
      {isAuthenticated && <Navbar />} {/* This will render NavigationIsland for auth users */}
      <Footer className={location.pathname === '/documentation' ? 'lg:ml-72' : ''} />
    </div>
  );
};

export default Layout;
