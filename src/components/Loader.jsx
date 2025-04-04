// components/Spinner.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Spinner = ({
  size = 'md',          // sm, md, lg
  color = 'primary',    // primary, gray, accent
  message = '',         // Optional text
  fullScreen = false,   // Fullscreen overlay
}) => {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colors = {
    primary: 'text-blue-600',
    gray: 'text-gray-500',
    accent: 'text-purple-600'
  };

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center ${
        fullScreen ? 'fixed inset-0 bg-white/80 z-50' : ''
      }`}
    >
      <svg
        className={`animate-spin ${sizes[size]} ${colors[color]}`}
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      
      {message && (
        <p className="mt-3 text-gray-600 text-sm font-medium">
          {message}
        </p>
      )}
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'gray', 'accent']),
  message: PropTypes.string,
  fullScreen: PropTypes.bool
};

export default Spinner;