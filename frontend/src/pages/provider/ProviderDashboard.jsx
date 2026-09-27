import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';
import AIIndicator from '../../components/common/AIIndicator';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { Wrench, DollarSign, Briefcase, Star, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle, Clock, Calendar, CheckSquare } from 'lucide-react';

export const ProviderDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProviderDashboardData();
  }, []);

  const fetchProviderDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, quotesRes, matchedRes] = await Promise.allSettled([
        api.get('/providers/profile/me'),
        api.get('/quotes/my'),
        api.get('/requests/matched')
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data.success) {
        setProfile(profileRes.value.data.profile);
      }
      if (quotesRes.status === 'fulfilled' && quotesRes.value.data.success) {
        setQuotes(quotesRes.value.data.quotes);
      }
      if (matchedRes.status === 'fulfilled' && matchedRes.value.data.success) {
        setMatchedRequests(matchedRes.value.data.requests);
      }
    } catch (err) {
      setError('Failed to load provider metrics.');
    } finally {
      setLoading(false);
    }
  };

  const assignedJobsCount = quotes.filter(q => q.status === 'Accepted').length;
  const pendingQuotesCount = quotes.filter(q => q.status === 'Pending').length;
  const totalEarningsEst = quotes.filter(q => q.status === 'Accepted').reduce((acc, q) => acc + (q.estimatedCost || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* OPERATIONAL HEADER */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Provider Operations Portal
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Good morning, {user?.name || 'Rahul'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.15rem' }}>
            Here's what needs your attention today.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <StatusIndicator status={profile?.verificationStatus || 'Pending'} />
          <Badge role="Service Provider" />
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #f8d5d5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* OPERATIONAL METRIC CARDS */}
      <div className="grid-4">
        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-primary-deep)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : assignedJobsCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Today's Jobs</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : pendingQuotesCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Pending Proposals</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : `₹${totalEarningsEst}`}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Month's Earnings (₹)</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-ai)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <Briefcase size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : matchedRequests.length}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Matched Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN PROVIDER GRID */}
      <div className="grid-2">
        {/* Profile Capability & Verification Status */}
        <Card title="Provider Capability Profile" subtitle="Configured service rate, skills, and background verification">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary-deep)' }}>Verification Status</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Background checks & document audits</div>
              </div>
              <StatusIndicator status={profile?.verificationStatus || 'Pending'} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary-deep)' }}>Base Hourly Rate</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Configured default rate</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                ₹{profile?.hourlyRate || 499}/hr
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary-deep)', marginBottom: '0.375rem' }}>Verified Skills:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {profile?.skills?.length > 0 ? (
                  profile.skills.map((s, idx) => <Badge key={idx} variant="info">{s}</Badge>)
                ) : (
                  <>
                    <Badge variant="info">AC Diagnostics</Badge>
                    <Badge variant="info">Wiring & Electrical</Badge>
                    <Badge variant="info">Refrigeration</Badge>
                  </>
                )}
              </div>
            </div>

            <Button to="/dashboard/provider/profile" variant="primary" icon={ShieldCheck} style={{ marginTop: '0.5rem' }}>
              Update Profile & Upload Credentials
            </Button>
          </div>
        </Card>

        {/* Matched Job Opportunities */}
        <Card
          title="New Matched Requests"
          subtitle="AI-matched customer jobs in your area"
          action={
            <Link to="/dashboard/provider/opportunities" style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Browse Job Opportunities <ArrowRight size={14} />
            </Link>
          }
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>Searching for matched jobs...</div>
          ) : matchedRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-muted)' }}>
              <Briefcase size={36} color="var(--color-text-muted)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.875rem' }}>No new matched requests right now. Check back shortly!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {matchedRequests.slice(0, 3).map(reqDoc => (
                <div key={reqDoc._id} style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-primary-deep)' }}>{reqDoc.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Category: {reqDoc.category?.name || 'General'} | Urgency: {reqDoc.urgency}</div>
                  </div>
                  <Link to="/dashboard/provider/opportunities">
                    <Button size="sm" variant="accent">Submit Quote</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProviderDashboard;
