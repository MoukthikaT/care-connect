import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const AIIndicator = ({ variant = 'badge', confidence, category, skills = [], urgency, reasons = [] }) => {
  if (variant === 'badge') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.65rem',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #f3f2fe 0%, #e8e5ff 100%)',
          color: 'var(--color-ai)',
          fontSize: '0.75rem',
          fontWeight: 800,
          border: '1px solid rgba(122, 111, 240, 0.3)',
          letterSpacing: '0.03em',
          boxShadow: '0 2px 6px rgba(122, 111, 240, 0.12)'
        }}
      >
        <Sparkles size={13} strokeWidth={2.5} />
        ✦ AI ASSISTED
      </span>
    );
  }

  if (variant === 'match-badge') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #7A6FF0 0%, #5b4ee6 100%)',
          color: '#ffffff',
          fontSize: '0.78125rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          boxShadow: '0 4px 12px rgba(122, 111, 240, 0.3)'
        }}
      >
        <Sparkles size={13} strokeWidth={2.5} />
        AI MATCH {confidence}%
      </span>
    );
  }

  if (variant === 'breakdown') {
    const displayReasons = reasons;

    return (
      <div className="card-ai-assisted" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-ai-light)', color: 'var(--color-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-ai)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AI UNDERSTANDS YOUR REQUEST
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-deep)' }}>
                {category}
              </div>
            </div>
          </div>

          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-ai)', backgroundColor: 'var(--color-ai-light)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(122, 111, 240, 0.25)' }}>
            {confidence != null ? `Confidence ${confidence}%` : 'Classification result'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '0.875rem', backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Urgency</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: urgency === 'High' ? 'var(--color-danger)' : 'var(--color-primary-deep)' }}>{urgency}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Required Skills</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>
              {skills.length > 0 ? skills.join(', ') : 'No skills identified'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {displayReasons.map((reason, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              <CheckCircle2 size={14} color="var(--color-success)" strokeWidth={2.5} />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default AIIndicator;
