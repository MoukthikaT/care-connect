import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';
import Input from '../../components/common/Input';
import AIIndicator from '../../components/common/AIIndicator';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { CheckSquare, Layers, Users, Activity, Sparkles, MapPin, Search, ArrowRight, AlertCircle, Eye } from 'lucide-react';

export const OpsDashboard = () => {
  const { user } = useAuth();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verifiedProviders, setVerifiedProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Oversight Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchOpsDashboardData();
  }, []);

  const fetchOpsDashboardData = async () => {
    try {
      setLoading(true);
      const [pendingRes, verifiedRes, catRes, reqRes] = await Promise.allSettled([
        api.get('/providers/verifications/pending?status=Pending'),
        api.get('/providers/verifications/pending?status=Verified'),
        api.get('/categories?includeInactive=true'),
        api.get('/requests')
      ]);

      if (pendingRes.status === 'fulfilled' && pendingRes.value.data.success) {
        setPendingVerifications(pendingRes.value.data.verifications);
      }
      if (verifiedRes.status === 'fulfilled' && verifiedRes.value.data.success) {
        setVerifiedProviders(verifiedRes.value.data.verifications);
      }
      if (catRes.status === 'fulfilled' && catRes.value.data.success) {
        setCategories(catRes.value.data.categories);
      }
      if (reqRes.status === 'fulfilled' && reqRes.value.data.success) {
        setAllRequests(reqRes.value.data.requests);
      }
    } catch (err) {
      setError('Failed to load operations metrics.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = allRequests.filter(reqDoc => {
    const matchesSearch = (reqDoc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (reqDoc.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (reqDoc.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || reqDoc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
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
            Operations Control Tower
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Operations Overview
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Oversee provider verifications, category domain rules, and platform dispatching.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
          <Button to="/dashboard/ops/verifications" variant="accent" icon={CheckSquare}>
            Verification Queue ({pendingVerifications.length})
          </Button>
          <Badge role="Operations Manager" />
        </div>
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
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <CheckSquare size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : pendingVerifications.length}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Pending Verifications</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <Layers size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : categories.length}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Service Domains</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : verifiedProviders.length}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Verified Providers</div>
            </div>
          </div>
        </div>

        <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-ai)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                {loading ? '...' : allRequests.length}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Platform Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* OPERATIONS OVERSIGHT DATA TABLE */}
      <Card title="Platform Request Oversight Console" subtitle="Monitor customer requests, AI confidence scores, and dispatch fulfillment status">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search by request title, category, or customer..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            {['All', 'Open', 'Quoted', 'Assigned', 'Cancelled'].map(st => (
              <button
                key={st}
                className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>Loading Service Requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
            No platform service requests found matching the current filters.
          </div>
        ) : (
          <div className="care-table-container">
            <table className="care-table">
              <thead>
                <tr>
                  <th>Request Title</th>
                  <th>Customer Name</th>
                  <th>Category & AI Confidence</th>
                  <th>Urgency</th>
                  <th>Dispatch Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary-deep)' }}>{r.title}</td>
                    <td style={{ color: 'var(--color-text-dark)', fontWeight: 600 }}>{r.customer?.name || 'Customer'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.category?.name || r.aiAnalysis?.suggestedCategory || 'General'}</div>
                      {r.aiAnalysis?.confidenceScore != null && <div style={{ fontSize: '0.75rem', color: 'var(--color-ai)', fontWeight: 800, marginTop: '2px' }}>
                        AI classification confidence: {Math.round(r.aiAnalysis.confidenceScore * 100)}%
                      </div>}
                    </td>
                    <td>
                      <Badge variant={r.urgency === 'Emergency' ? 'danger' : r.urgency === 'High' ? 'warning' : 'info'}>
                        {r.urgency}
                      </Badge>
                    </td>
                    <td>
                      <StatusIndicator status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OpsDashboard;
