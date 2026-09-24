import React from 'react';

export const Skeleton = ({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', className = '' }) => {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="card-care" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Skeleton width="48px" height="48px" borderRadius="12px" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="60%" height="18px" />
          <Skeleton width="40%" height="14px" />
        </div>
      </div>
      <Skeleton width="100%" height="40px" />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <Skeleton width="30%" height="16px" />
        <Skeleton width="30%" height="16px" />
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 4 }) => {
  return (
    <div className="care-table-container">
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Skeleton width="36px" height="36px" borderRadius="50%" />
            <Skeleton width="25%" height="16px" />
            <Skeleton width="35%" height="16px" />
            <Skeleton width="15%" height="24px" borderRadius="12px" />
            <Skeleton width="10%" height="32px" borderRadius="6px" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
