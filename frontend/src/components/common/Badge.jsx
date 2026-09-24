import React from 'react';

export const Badge = ({ role, variant, children, className = '', style = {} }) => {
  let badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.25rem 0.75rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  };

  if (role) {
    switch (role) {
      case 'Platform Admin':
        badgeStyle = { ...badgeStyle, backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };
        break;
      case 'Operations Manager':
        badgeStyle = { ...badgeStyle, backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-deep)', border: '1px solid #bce0d8' };
        break;
      case 'Service Provider':
        badgeStyle = { ...badgeStyle, backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' };
        break;
      case 'Customer':
        badgeStyle = { ...badgeStyle, backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid #f9ded0' };
        break;
      case 'Support Agent':
        badgeStyle = { ...badgeStyle, backgroundColor: 'var(--color-warning-light)', color: '#854d0e', border: '1px solid #fef08a' };
        break;
      default:
        badgeStyle = { ...badgeStyle, backgroundColor: 'var(--color-cream)', color: 'var(--color-primary-deep)', border: '1px solid var(--color-sand)' };
    }
  } else if (variant) {
    switch (variant) {
      case 'success':
        badgeStyle = { ...badgeStyle, backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid #c6ebd9' };
        break;
      case 'warning':
        badgeStyle = { ...badgeStyle, backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid #fce8c8' };
        break;
      case 'danger':
        badgeStyle = { ...badgeStyle, backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #f8d5d5' };
        break;
      case 'ai':
        badgeStyle = { ...badgeStyle, backgroundColor: 'var(--color-ai-light)', color: 'var(--color-ai)', border: '1px solid #e0dcfd' };
        break;
      default:
        badgeStyle = { ...badgeStyle, backgroundColor: 'var(--color-cream)', color: 'var(--color-primary-deep)', border: '1px solid var(--color-sand)' };
    }
  }

  return (
    <span className={className} style={{ ...badgeStyle, ...style }}>
      {children || role}
    </span>
  );
};

export default Badge;
