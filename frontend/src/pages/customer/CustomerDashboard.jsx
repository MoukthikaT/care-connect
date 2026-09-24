import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';
import AIIndicator from '../../components/common/AIIndicator';
import Skeleton, { CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { 
  PlusCircle, 
  CalendarCheck, 
  FileText, 
  Clock, 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  AlertCircle, 
  Search, 
  Star, 
  ShieldCheck, 
  Wrench, 
  Droplet, 
  Zap, 
  Fan, 
  CheckCircle2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchProblem, setSearchProblem] = useState('');
  const [aiAnalysisPreview, setAiAnalysisPreview] = useState(null);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests/my');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!searchProblem.trim()) return;
    setError('');
    setAiAnalysisPreview(null);
    try {
      const { data } = await api.post('/requests/classify-preview', { description: searchProblem });
      setAiAnalysisPreview(data.aiAnalysis);
    } catch (err) {
      setError(err.response?.data?.message || 'Service classification is temporarily unavailable. Please try again.');
    }
  };

  const activeRequestsCount = requests.filter(r => ['Open', 'Quoted'].includes(r.status)).length;
  const confirmedBookingsCount = requests.filter(r => ['Assigned', 'Fulfilled'].includes(r.status)).length;
  const pendingQuotesCount = requests.filter(r => r.status === 'Quoted').length;
  const totalRequestsCount = requests.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* PERSONAL COMMAND CENTER HEADER */}
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
            Customer Command Center
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Good morning, {user?.name || 'Homeowner'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginTop: '0.15rem' }}>
            How can we help around your home today?
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
          <Button to="/dashboard/customer/create-request" variant="accent" icon={PlusCircle}>
            Tell Us What You Need
          </Button>
          <Badge role="Customer" />
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #f8d5d5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* LARGE AI SEARCH & INTENT CARD */}
      <div
        className="card-care card-ai-assisted"
        style={{ padding: '2.25rem 2rem', borderRadius: 'var(--radius-xl)' }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AIIndicator variant="badge" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Natural Language Home Repair Triage
            </span>
          </div>

          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, marginBottom: '1rem' }}>
            What does your home need today?
          </h2>

          <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
              <input
                type="text"
                className="form-input"
                placeholder='e.g., "My AC is running but the room isn’t getting cold" or "Kitchen pipe leaking under sink"...'
                value={searchProblem}
                onChange={(e) => setSearchProblem(e.target.value)}
                style={{ paddingRight: '2.5rem', fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', padding: '0.875rem 1.125rem' }}
              />
              <Search size={20} color="var(--color-text-muted)" style={{ position: 'absolute', right: '14px', top: '14px' }} />
            </div>
            <Button type="submit" variant="ai" icon={Sparkles}>
              Ask AI
            </Button>
          </form>

          {/* Instant AI Classification Breakdown Preview */}
          {aiAnalysisPreview && (
            <div style={{ marginTop: '1.5rem' }} className="animate-fade-in">
              <AIIndicator
                variant="breakdown"
                confidence={Math.round((aiAnalysisPreview.confidenceScore || 0) * 100)}
                category={aiAnalysisPreview.suggestedCategory}
                urgency={aiAnalysisPreview.urgency}
                skills={aiAnalysisPreview.detectedSkills}
                reasons={aiAnalysisPreview.aiTags}
              />
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  to={`/dashboard/customer/create-request?problem=${encodeURIComponent(searchProblem)}`}
                  variant="accent"
                  size="sm"
                  icon={ArrowRight}
                >
                  Post This AI Service Request
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OPERATIONAL METRIC STAT CARDS */}
      <div className="grid-4">
        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-primary-deep)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <PlusCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : activeRequestsCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Active Requests</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <CalendarCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : confirmedBookingsCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Confirmed Bookings</div>
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
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Pending Pro Quotes</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-ai)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <FileText size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : totalRequestsCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Total Requests</div>
            </div>
          </div>
        </div>
      </div>

      <Card title="Provider matching" subtitle="Matches are generated for each request using the platform matching service.">
        <EmptyState title="Matches are linked to your requests" description="Open a request to review its provider matches after matching is available." actionText="View my requests" actionLink="/dashboard/customer/requests" />
      </Card>
      {/* RECENT SERVICE REQUESTS TIMELINE */}
      <Card
        title="Recent Requests & Bookings"
        subtitle="Real-time status tracking, AI triage tags, and provider proposals"
        action={
          <Link to="/dashboard/customer/requests" style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View All Requests <ArrowRight size={14} />
          </Link>
        }
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No upcoming services"
            description="Your home is all caught up. Whenever a repair or maintenance task pops up, post a request to get instant AI matching and quotes."
            actionText="Post Service Request"
            actionLink="/dashboard/customer/create-request"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {requests.slice(0, 4).map(reqDoc => (
              <div
                key={reqDoc._id}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem',
                  backgroundColor: 'var(--color-cream)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-sand)',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                    <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-primary-deep)' }}>{reqDoc.title}</h4>
                    <StatusIndicator status={reqDoc.status} />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.625rem', lineHeight: 1.5 }}>
                    {reqDoc.description}
                  </p>
                  <div style={{ fontSize: '0.78125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>Category: <strong>{reqDoc.category?.name || 'General'}</strong></span>
                    <span><MapPin size={13} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {reqDoc.location?.address}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Link to="/dashboard/customer/requests">
                    <Button size="sm" variant="outline">
                      View Details & Quotes
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CustomerDashboard;
