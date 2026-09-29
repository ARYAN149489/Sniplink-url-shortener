import React from 'react';

const Logo = ({ size = 28, className = '' }) => {
  return (
    <div
      className={`brand-logo-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        flexShrink: 0,
      }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
          stroke="#3b82f6"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
          stroke="#60a5fa"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="1.5" fill="#93c5fd" />
      </svg>
    </div>
  );
};

export default Logo;
