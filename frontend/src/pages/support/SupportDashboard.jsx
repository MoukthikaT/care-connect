import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import AIIndicator from '../../components/common/AIIndicator';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { ShieldAlert, CheckCircle2, FileText, Clock, Search, Eye, AlertCircle, Sparkles, MapPin, Phone, Mail, MessageSquare } from 'lucide-react';

export const SupportDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('All');

  // Selected Ticket Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  const fetchSupportTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests');
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  const emergencyCount = requests.filter(r => r.urgency === 'Emergency').length;
  const highPriorityCount = requests.filter(r => r.urgency === 'High').length;
  const openCount = requests.filter(r => r.status === 'Open').length;
  const assignedCount = requests.filter(r => r.status === 'Assigned').length;

  const filteredTickets = requests.filter(r => {
    const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r._id || '').includes(searchQuery) ||
                          (r.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterTag === 'Emergency') return matchesSearch && r.urgency === 'Emergency';
    if (filterTag === 'High Priority') return matchesSearch && r.urgency === 'High';
    if (filterTag === 'Open') return matchesSearch && r.status === 'Open';
    if (filterTag === 'Assigned') return matchesSearch && r.status === 'Assigned';
    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
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
            Support & Dispute Resolution Command
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Support Command Center
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Mediate customer-provider issues, review AI triage tags, and inspect ticket details.
          </p>
        </div>
        <Badge role="Support Agent" />
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #f8d5d5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* METRIC STAT CARDS */}
      <div className="grid-4">
        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : emergencyCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Critical Emergencies</div>
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
                {loading ? '...' : highPriorityCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>High Priority Queue</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <FileText size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : openCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Open Tickets</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : assignedCount}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Active Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* SUPPORT DESK & TICKET MODERATION CONSOLE */}
      <Card title="Support Ticket & Dispute Moderation Desk" subtitle="Inspect customer service requests, priority indicators, and contact info">
        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search tickets by ID, title, description, or customer..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {['All', 'Emergency', 'High Priority', 'Open', 'Assigned'].map(t => (
              <button
                key={t}
                className={`btn ${filterTag === t ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setFilterTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>Loading Support Tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No support tickets match"
            description="There are currently no active tickets under the selected filter."
          />
        ) : (
          <div className="grid-2">
            {filteredTickets.map(ticket => (
              <div key={ticket._id} className="card-care" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                        Ticket #{ticket._id.slice(-6).toUpperCase()}
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
                        {ticket.title}
                      </h3>
                    </div>
                    <StatusIndicator status={ticket.status} />
                  </div>

                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.875rem' }}>
                    {ticket.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Priority: <Badge variant={ticket.urgency === 'Emergency' ? 'danger' : ticket.urgency === 'High' ? 'warning' : 'info'}>{ticket.urgency}</Badge>
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Category: <strong>{ticket.category?.name || 'General'}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <Button size="sm" variant="accent" icon={Eye} onClick={() => setSelectedTicket(ticket)}>
                    Inspect Ticket Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ticket Details Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Support Ticket: ${selectedTicket?.title}`}
        maxWidth="600px"
      >
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)' }}>
              <h4 style={{ fontWeight: 800, color: 'var(--color-primary-deep)', fontSize: '0.9375rem' }}>Customer Contact Info</h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-dark)', marginTop: '0.35rem' }}>
                Name: <strong>{selectedTicket.customer?.name}</strong><br />
                Email: {selectedTicket.customer?.email || 'N/A'}<br />
                Phone: {selectedTicket.customer?.phone || 'Not provided'}
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: 800, color: 'var(--color-primary-deep)', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <MapPin size={16} color="var(--color-accent)" /> Service Address
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{selectedTicket.location?.address}</p>
            </div>

            {selectedTicket.aiAnalysis && (
              <AIIndicator
                variant="breakdown"
                confidence={Math.round((selectedTicket.aiAnalysis.confidenceScore || 0.94) * 100)}
                category={selectedTicket.aiAnalysis.suggestedCategory || 'HVAC Repair'}
                skills={selectedTicket.aiAnalysis.detectedSkills || ['AC Diagnostics']}
                urgency={selectedTicket.urgency}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Button variant="primary" onClick={() => setSelectedTicket(null)}>
                Close Ticket Window
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportDashboard;
