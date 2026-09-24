import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { DollarSign, FileText, CheckCircle2, AlertCircle, XCircle, CalendarCheck, MapPin, Clock } from 'lucide-react';

export const ProviderQuotesPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMyQuotes();
  }, []);

  const fetchMyQuotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotes/my');
      if (res.data.success) {
        setQuotes(res.data.quotes);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load submitted quotes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelQuote = async (quoteId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/quotes/${quoteId}/cancel`);
      setSuccess(res.data.message);
      fetchMyQuotes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel quote.');
    }
  };

  const filteredQuotes = quotes.filter(q => {
    if (activeTab === 'Pending') return q.status === 'Pending';
    if (activeTab === 'Accepted / Assigned Jobs') return q.status === 'Accepted';
    if (activeTab === 'Declined') return ['Rejected', 'Expired'].includes(q.status);
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Proposals & Quotes Tracker
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Submitted Quotes & Assigned Jobs
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Track submitted price proposals, customer acceptances, and assigned job details.
          </p>
        </div>
        <Badge role="Service Provider" />
      </div>

      {success && (
        <div style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #c6ebd9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #f8d5d5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Accepted / Assigned Jobs', 'Declined'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} ({
              tab === 'All' ? quotes.length :
              tab === 'Pending' ? quotes.filter(q => q.status === 'Pending').length :
              tab === 'Accepted / Assigned Jobs' ? quotes.filter(q => q.status === 'Accepted').length :
              quotes.filter(q => ['Rejected', 'Expired'].includes(q.status)).length
            })
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>Loading Submitted Quotes...</div>
      ) : filteredQuotes.length === 0 ? (
        <EmptyState
          title="No proposals in this view"
          description={`There are currently no proposals under the '${activeTab}' filter.`}
        />
      ) : (
        <div className="grid-2">
          {filteredQuotes.map(q => (
            <div key={q._id} className="card-care" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                      {q.serviceRequest?.title || 'Service Job Proposal'}
                    </span>
                    <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
                      ${q.estimatedCost}
                    </h3>
                  </div>

                  {q.status === 'Accepted' ? <Badge variant="success">Accepted Job</Badge> :
                   q.status === 'Rejected' ? <Badge variant="danger">Declined</Badge> :
                   q.status === 'Expired' ? <Badge variant="warning">Cancelled</Badge> :
                   <Badge variant="warning">Pending Review</Badge>}
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-dark)', marginBottom: '0.75rem' }}>
                  <div><strong>Est. Duration:</strong> {q.estimatedDurationHours} hours</div>
                  {q.notes && <div style={{ color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>"{q.notes}"</div>}
                </div>

                {q.status === 'Accepted' && (
                  <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-success-light)', borderRadius: 'var(--radius-md)', border: '1px solid #c6ebd9' }}>
                    <div style={{ fontSize: '0.84375rem', fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <CalendarCheck size={16} /> Job Confirmed & Booking Active
                    </div>
                    <div style={{ fontSize: '0.78125rem', color: 'var(--color-text-dark)', marginTop: '0.25rem' }}>
                      Agreed Rate: <strong>${q.estimatedCost}</strong> | Customer address and dispatch schedule confirmed.
                    </div>
                  </div>
                )}
              </div>

              {q.status === 'Pending' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <Button size="sm" variant="danger" icon={XCircle} onClick={() => handleCancelQuote(q._id)}>
                    Withdraw Proposal
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderQuotesPage;
