import React from 'react';
import { Link } from 'react-router-dom';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  onClick,
  to,
  className = '',
  style = {},
  ...props
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const combinedClasses = `btn ${variantClass} ${sizeClass} ${className}`.trim();

  const content = (
    <>
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 15 : size === 'lg' ? 20 : 18} />}
          {children}
        </>
      )}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={combinedClasses} style={style} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
