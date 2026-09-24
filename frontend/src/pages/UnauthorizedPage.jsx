import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '520px', margin: '4rem auto 0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            backgroundColor: 'var(--color-danger-light)',
            color: 'var(--color-danger)',
            borderRadius: '50%',
            marginBottom: '1rem'
          }}>
            <ShieldAlert size={40} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>403 Access Forbidden</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
            Your account role <Badge role={user?.role} /> does not have permission to view this resource.
          </p>

          <Link to="/">
            <Button icon={ArrowLeft}>Return to Home</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
