import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { User, Mail, Lock, Phone, UserPlus, CheckCircle2, BriefcaseBusiness, Home } from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'Customer',
    street: '', city: '', state: '', zipCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }
      });
      navigate(user.role === 'Service Provider' ? '/dashboard/provider' : '/dashboard/customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto 3rem', backgroundColor: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
      <div style={{ backgroundColor: 'var(--color-primary-deep)', color: '#fff', padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="bg-connection-pattern">
        <div>
          <Logo size="lg" variant="inverse" />
          <div style={{ marginTop: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', fontWeight: 400, color: '#fff', lineHeight: 1.15, marginBottom: '1rem' }}>
              Join CareConnect.<br /><span style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>Home care, simplified.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '1rem', lineHeight: 1.6 }}>
              Choose how you use CareConnect and create your account.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem', marginTop: '2.5rem' }}>
            <div><CheckCircle2 size={18} color="var(--color-accent)" /> Post requests or offer professional services</div>
            <div><CheckCircle2 size={18} color="var(--color-accent)" /> AI-powered service matching</div>
            <div><CheckCircle2 size={18} color="var(--color-accent)" /> Verified and tracked service workflow</div>
          </div>
        </div>
        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,.15)', fontSize: '.8125rem', color: 'rgba(255,255,255,.65)' }}>
          Operations Manager, Platform Admin and Support Agent accounts are managed internally and cannot be created here.
        </div>
      </div>

      <div style={{ padding: '3.5rem 3rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>Create Account</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '.9375rem' }}>Select your account type to continue.</p>
        </div>

        {error && <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '.875rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '.875rem', marginBottom: '1.25rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.5rem' }}>
          {[
            { value: 'Customer', label: 'Customer', text: 'Book home services', icon: Home },
            { value: 'Service Provider', label: 'Service Provider', text: 'Offer your services', icon: BriefcaseBusiness }
          ].map(({ value, label, text, icon: Icon }) => (
            <button key={value} type="button" onClick={() => setFormData({ ...formData, role: value })} style={{ textAlign: 'left', padding: '1rem', borderRadius: 'var(--radius-md)', border: formData.role === value ? '2px solid var(--color-accent)' : '1px solid var(--border-color)', background: formData.role === value ? 'rgba(217,139,95,.08)' : '#fff', cursor: 'pointer' }}>
              <Icon size={20} color="var(--color-primary-deep)" />
              <div style={{ fontWeight: 800, marginTop: '.45rem', color: 'var(--color-primary-deep)' }}>{label}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--color-text-muted)', marginTop: '.2rem' }}>{text}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <Input label="Full Name" name="name" icon={User} placeholder="Your name" value={formData.name} onChange={handleChange} required />
          <Input label="Email Address" name="email" type="email" icon={Mail} placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
          <Input label="Phone Number" name="phone" type="tel" icon={Phone} placeholder="Phone number" value={formData.phone} onChange={handleChange} required />
          <Input label="Password" name="password" type="password" icon={Lock} placeholder="Minimum 6 characters" value={formData.password} onChange={handleChange} required />

          <div style={{ fontSize: '.875rem', fontWeight: 700, margin: '1rem 0 .5rem', color: 'var(--color-primary-deep)' }}>Service Address</div>
          <div className="grid-2">
            <Input label="City" name="city" placeholder="Hyderabad" value={formData.city} onChange={handleChange} />
            <Input label="ZIP Code" name="zipCode" placeholder="500001" value={formData.zipCode} onChange={handleChange} />
          </div>

          <Button type="submit" loading={loading} variant="accent" icon={UserPlus} style={{ width: '100%', marginTop: '1.25rem' }}>
            Create {formData.role} Account
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '.875rem', color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-primary-deep)', fontWeight: 800 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
