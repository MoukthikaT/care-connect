import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import StatusIndicator from '../../components/common/StatusIndicator';
import AIIndicator from '../../components/common/AIIndicator';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  MapPin, 
  XCircle, 
  DollarSign, 
  CalendarCheck, 
  UserCheck, 
  Clock, 
  Navigation, 
  Check, 
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';

export const CustomerRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected Request & Quotes Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [isQuotesModalOpen, setIsQuotesModalOpen] = useState(false);

  // Job Tracking Stepper Drawer State
  const [trackingRequest, setTrackingRequest] = useState(null);
  const [rankedProviders, setRankedProviders] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchingError, setMatchingError] = useState('');

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests/my');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load service requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuotesModal = async (reqDoc) => {
    setSelectedRequest(reqDoc);
    setIsQuotesModalOpen(true);
    setLoadingQuotes(true);
    setError('');
    try {
      const res = await api.get(`/quotes/request/${reqDoc._id}`);
      if (res.data.success) {
        setQuotes(res.data.quotes);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quotes for this request.');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/quotes/${quoteId}/accept`);
      setSuccess(`Quote accepted! Your booking is confirmed. Pro will arrive at the scheduled time.`);
      setIsQuotesModalOpen(false);
      fetchMyRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept quote.');
    }
  };

  const handleCancelRequest = async (requestId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/requests/${requestId}/cancel`);
      setSuccess(res.data.message);
      fetchMyRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  const handleOpenTracking = async (request) => {
    setTrackingRequest(request);
    setRankedProviders([]);
    setMatchingError('');
    setLoadingMatches(true);
    try {
      const { data } = await api.get(`/requests/${request._id}/ranked-providers`);
      setRankedProviders(data.providers || []);
    } catch (err) {
      setMatchingError(err.response?.data?.message || 'Provider matches are temporarily unavailable.');
    } finally {
      setLoadingMatches(false);
    }
  };

  const filteredRequests = requests.filter(reqDoc => {
    if (activeTab === 'Open & Quoted') return ['Open', 'Quoted'].includes(reqDoc.status);
    if (activeTab === 'Bookings & Assigned') return ['Assigned', 'Fulfilled'].includes(reqDoc.status);
    if (activeTab === 'Cancelled') return reqDoc.status === 'Cancelled';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Service Management & Tracking
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            My Service Requests & Bookings
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Review AI triage analysis, compare provider proposals, and track live job progress.
          </p>
        </div>
        <Button to="/dashboard/customer/create-request" variant="accent" icon={PlusCircle}>
          Tell Us What You Need
        </Button>
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

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        {['All', 'Open & Quoted', 'Bookings & Assigned', 'Cancelled'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} ({
              tab === 'All' ? requests.length :
              tab === 'Open & Quoted' ? requests.filter(r => ['Open', 'Quoted'].includes(r.status)).length :
              tab === 'Bookings & Assigned' ? requests.filter(r => ['Assigned', 'Fulfilled'].includes(r.status)).length :
              requests.filter(r => r.status === 'Cancelled').length
            })
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>Loading Service Requests...</div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No requests in this view"
          description={`There are currently no service requests under the '${activeTab}' filter.`}
          actionText="Post New Service Request"
          actionLink="/dashboard/customer/create-request"
        />
      ) : (
        <div className="grid-2">
          {filteredRequests.map(reqDoc => (
            <div key={reqDoc._id} className="card-care" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {reqDoc.category?.name || 'General Repair'}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, marginTop: '0.1rem' }}>
                      {reqDoc.title}
                    </h3>
                  </div>
                  <StatusIndicator status={reqDoc.status} />
                </div>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {reqDoc.description}
                </p>

                {/* AI Triage Tags */}
                {reqDoc.aiAnalysis && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem', padding: '0.625rem 0.875rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-ai)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Sparkles size={13} /> AI Triage:
                    </span>
                    <Badge variant="ai">{reqDoc.aiAnalysis.suggestedCategory}</Badge>
                    {reqDoc.aiAnalysis.aiTags?.map((tag, tIdx) => (
                      <Badge key={tIdx} variant="warning">{tag}</Badge>
                    ))}
                  </div>
                )}

                {/* Assigned Booking Banner */}
                {['Assigned', 'Fulfilled'].includes(reqDoc.status) && (
                  <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-success-light)', borderRadius: 'var(--radius-md)', border: '1px solid #c6ebd9', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.84375rem', fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <CalendarCheck size={16} /> Booking Confirmed & Dispatch Active
                    </div>
                    <div style={{ fontSize: '0.78125rem', color: 'var(--color-text-dark)', marginTop: '0.25rem' }}>
                      Preferred Schedule: {reqDoc.preferredSchedule?.date ? new Date(reqDoc.preferredSchedule.date).toLocaleDateString() : 'Not specified'}{reqDoc.preferredSchedule?.timeSlot ? ` · ${reqDoc.preferredSchedule.timeSlot}` : ''}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="var(--color-primary)" /> {reqDoc.location?.address}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Open', 'Quoted'].includes(reqDoc.status) && <Button size="sm" variant="outline" icon={Sparkles} onClick={() => handleOpenTracking(reqDoc)}>Provider matches</Button>}
                  {['Assigned', 'Fulfilled'].includes(reqDoc.status) && (
                    <Button size="sm" variant="accent" icon={Navigation} onClick={() => handleOpenTracking(reqDoc)}>
                      View request
                    </Button>
                  )}
                  {['Open', 'Quoted'].includes(reqDoc.status) && (
                    <Button size="sm" variant="primary" icon={DollarSign} onClick={() => handleOpenQuotesModal(reqDoc)}>
                      View Quotes ({reqDoc.status === 'Quoted' ? 'Proposals Ready' : 'Pending Pro'})
                    </Button>
                  )}
                  {['Open', 'Draft', 'Quoted'].includes(reqDoc.status) && (
                    <Button size="sm" variant="outline" icon={XCircle} onClick={() => handleCancelRequest(reqDoc._id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PROVIDER QUOTE EVALUATION & MATCHING MODAL */}
      <Modal
        isOpen={isQuotesModalOpen}
        onClose={() => setIsQuotesModalOpen(false)}
        title={`Quotes & Proposals for: ${selectedRequest?.title}`}
        maxWidth="640px"
      >
        {loadingQuotes ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>Fetching live provider proposals...</div>
        ) : quotes.length === 0 ? (
          <EmptyState
            title="Awaiting provider proposals"
            description="Our AI matching engine has notified verified providers within your service radius. Quotes usually arrive within a few minutes."
            compact
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {quotes.map(q => (
              <div key={q._id} className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-primary-deep)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {q.provider?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-primary-deep)' }}>
                        {q.provider?.name || 'Verified Service Provider'}
                      </h4>
                      <div style={{ fontSize: '0.78125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        Provider quote details
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-deep)' }}>${q.estimatedCost}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Est. Duration: {q.estimatedDurationHours} hr(s)</div>
                  </div>
                </div>

                <AIIndicator variant="match-badge" confidence={94} />

                {q.notes && (
                  <p style={{ fontSize: '0.84375rem', color: 'var(--color-text-dark)', margin: '0.75rem 0', lineHeight: 1.5 }}>
                    "{q.notes}"
                  </p>
                )}

                {q.status === 'Pending' && (
                  <Button size="sm" variant="accent" icon={CheckCircle2} onClick={() => handleAcceptQuote(q._id)} style={{ width: '100%', marginTop: '0.75rem' }}>
                    Accept Quote & Confirm Booking
                  </Button>
                )}

                {q.status === 'Accepted' && <Badge variant="success">Accepted Quote</Badge>}
                {q.status === 'Rejected' && <Badge variant="danger">Declined Quote</Badge>}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* VISUAL JOB TRACKING TIMELINE MODAL */}
      {trackingRequest && (
        <Modal
          isOpen={true}
          onClose={() => setTrackingRequest(null)}
          title={`Request details: ${trackingRequest.title}`}
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card-care">
              <div style={{ fontSize: '.72rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase' }}>Request status</div>
              <h3 style={{ margin: '.35rem 0', color: 'var(--color-primary-deep)' }}>{trackingRequest.title}</h3>
              <StatusIndicator status={trackingRequest.status}/>
              {trackingRequest.preferredSchedule?.date && <p style={{ marginTop: '.8rem', color: 'var(--color-text-muted)' }}>Preferred: {trackingRequest.preferredSchedule.date}{trackingRequest.preferredSchedule.timeSlot ? ` · ${trackingRequest.preferredSchedule.timeSlot}` : ''}</p>}
              <p style={{ marginTop: '.8rem', color: 'var(--color-text-muted)', fontSize: '.85rem' }}>Booking milestones will appear as the provider updates this request.</p>
            </div>
            <div>
              <h3 style={{ marginBottom: '.75rem' }}>Provider matches</h3>
              {loadingMatches ? <p>Finding providers…</p> : matchingError ? <p role="alert">{matchingError}</p> : rankedProviders.length === 0 ? <EmptyState title="No provider matches yet" description="The matching service has not found eligible providers for this request."/> : <div style={{ display:'grid',gap:'.7rem' }}>{rankedProviders.map(match=><div key={match.profileId} className="card-care" style={{display:'flex',justifyContent:'space-between',gap:'1rem',alignItems:'center',padding:'1rem'}}><div><strong>{match.businessName || match.provider?.name}</strong><div style={{fontSize:'.8rem',color:'var(--color-text-muted)',marginTop:'.25rem'}}>{(match.skills || []).join(' · ') || 'Service category match'} · {match.distanceInKm} km</div>{match.rating?.count > 0 && <div style={{fontSize:'.78rem',color:'var(--color-text-muted)',marginTop:'.25rem'}}>Customer rating {match.rating.average} ({match.rating.count})</div>}</div><Badge variant="ai">{match.matchScore}% match</Badge></div>)}</div>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerRequestsPage;
