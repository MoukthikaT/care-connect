import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Mail, Lock, LogIn, Sparkles, ShieldCheck, ArrowRight, HeartHandshake, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (role) => {
    switch (role) {
      case 'Customer': return '/dashboard/customer';
      case 'Service Provider': return '/dashboard/provider';
      case 'Operations Manager': return '/dashboard/ops';
      case 'Platform Admin': return '/dashboard/admin';
      case 'Support Agent': return '/dashboard/support';
      default: return '/';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      const from = location.state?.from?.pathname || redirectPath(loggedUser.role);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '2rem auto 3rem auto',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))'
      }}
    >
      {/* LEFT SPLIT PANEL: BRANDING & ILLUSTRATION */}
      <div
        style={{
          backgroundColor: 'var(--color-primary-deep)',
          color: '#ffffff',
          padding: '3.5rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}
        className="bg-connection-pattern"
      >
        <div>
          <Logo size="lg" variant="inverse" />

          <div style={{ marginTop: '3rem' }}>
            <h1
              style={{
                fontSize: '2.5rem',
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '1rem'
              }}
            >
              Your home.<br />
              <span style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>Handled with care.</span>
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '400px' }}>
              Sign in to your CareConnect account to manage service requests, verified bookings, or provider operations.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <CheckCircle2 size={18} color="var(--color-accent)" /> Provider verification workflow
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <CheckCircle2 size={18} color="var(--color-accent)" /> AI-Powered Skill & Schedule Matching
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              <CheckCircle2 size={18} color="var(--color-accent)" /> Booking progress and updates
            </div>
          </div>
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Staff accounts
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,.65)', marginTop: '.5rem', lineHeight: 1.5 }}>
            Staff access is managed by your CareConnect administrator. Public registration is for customers and service providers.
          </p>
        </div>
      </div>

      {/* RIGHT SPLIT PANEL: FORM */}
      <div style={{ padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, marginBottom: '0.5rem' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Please enter your credentials to sign in.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--color-danger-light)',
            color: 'var(--color-danger)',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            border: '1px solid #f8d5d5'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            placeholder="user@careconnect.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} variant="primary" icon={LogIn} style={{ width: '100%' }}>
            Sign In to Account
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Don't have a CareConnect account yet?{' '}
          <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 800 }}>
            Register as Customer or Provider
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
