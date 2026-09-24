import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '540px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        backgroundColor: 'rgba(23, 63, 58, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-container animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xl)',
          padding: '1.75rem',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          {title && (
            <h3 style={{ fontSize: '1.375rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: footer ? '1.5rem' : 0 }}>
          {children}
        </div>

        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
