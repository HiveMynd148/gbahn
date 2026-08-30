import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const ManagedToaster = () => {
  const { isDarkMode } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Define default options that apply to all toasts
        className: 'font-medium text-sm',
        style: {
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: isDarkMode 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(8px)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
};

export default ManagedToaster;
