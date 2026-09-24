import React from 'react';

export const Card = ({
  title,
  subtitle,
  action,
  children,
  hoverable = false,
  variant = 'default',
  className = '',
  style = {},
  onClick
}) => {
  const variantClass = variant === 'cream' ? 'card-cream' : variant === 'ai' ? 'card-ai-assisted' : '';
  const hoverClass = hoverable ? 'card-hover' : '';

  return (
    <div
      className={`card-care ${variantClass} ${hoverClass} ${className}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
    >
      {(title || action || subtitle) && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          gap: '1rem'
        }}>
          <div>
            {title && (
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.84375rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
