import React from 'react';

const Button = ({ children, onClick, type = "button", variant = "primary", className = "", disabled = false }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "text-white bg-primary hover:bg-primary-dark focus:ring-primary",
    secondary: "text-primary bg-indigo-50 hover:bg-indigo-100 focus:ring-primary dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
