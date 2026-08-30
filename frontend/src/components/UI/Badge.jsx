import React from 'react';

const Badge = ({ text, color = "gray", className = "" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    teal: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`}>
      {text}
    </span>
  );
};

export default Badge;
