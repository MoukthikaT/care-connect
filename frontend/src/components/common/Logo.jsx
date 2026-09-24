import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', variant = 'default', showTagline = true, to = '/' }) {
  const inverse = variant === 'inverse';
  const sizes = { sm: 32, md: 40, lg: 52 };
  const markSize = sizes[size] || sizes.md;
  const content = <span className={`brand-lockup ${inverse ? 'brand-inverse' : ''} brand-${size}`}>
    <span className="brand-mark" style={{ width: markSize, height: markSize }} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none"><path d="M24 6.5 39 18v19a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V18L24 6.5Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/><path d="M18 25.5c0-3 2.5-5 6-1.8 3.5-3.2 6-1.2 6 1.8 0 3.1-6 7-6 7s-6-3.9-6-7Z" fill="currentColor"/><path d="M5 20c2.2 0 3.7-1.3 4.8-3.6M43 20c-2.2 0-3.7-1.3-4.8-3.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    </span>
    <span className="brand-type"><span className="brand-name">Care<span>Connect</span></span>{showTagline && <span className="brand-tagline">HOME, WITH CARE</span>}</span>
  </span>;
  return to ? <Link className="brand-link" to={to} aria-label="CareConnect home">{content}</Link> : content;
}
