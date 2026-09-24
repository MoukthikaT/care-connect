import React from 'react';
import { Home, Sparkles, Inbox } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'Your home is all caught up. Explore available services or post a new request whenever you need help.',
  actionText,
  onAction,
  actionLink,
  compact = false
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '2rem 1rem' : '3.5rem 1.5rem',
        backgroundColor: 'var(--color-cream)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--color-sand)',
        maxWidth: '520px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: '#ffffff',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)'
        }}
      >
        <Icon size={32} strokeWidth={1.75} />
      </div>

      <h3 style={{ fontSize: compact ? '1.125rem' : '1.375rem', fontWeight: 400, fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', marginBottom: '0.5rem' }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: (actionText || actionLink) ? '1.5rem' : 0, maxWidth: '400px', lineHeight: 1.5 }}>
        {description}
      </p>

      {(actionText || actionLink) && (
        <Button variant="primary" onClick={onAction} to={actionLink}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
