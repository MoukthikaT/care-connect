import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';
import api from '../../services/api';
import { Users, Shield, Activity, DollarSign, Layers, CheckSquare, ShieldCheck, AlertCircle, FileText, RefreshCw } from 'lucide-react';

export const AdminDashboard = () => {
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [catRes, analyticsRes, auditRes] = await Promise.allSettled([
        api.get('/categories?includeInactive=true'),
        api.get('/audit/analytics'),
        api.get('/audit/logs?limit=50')
      ]);

      if (catRes.status === 'fulfilled' && catRes.value.data.success) {
        setCategories(catRes.value.data.categories);
      }
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data.success) {
        setAnalytics(analyticsRes.value.data.analytics);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value.data.success) {
        setAuditLogs(auditRes.value.data.logs);
      }
    } catch (err) {
      setError('Failed to load admin platform metrics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Platform Governance Console
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Platform Administration
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Platform analytics, category oversight, and security audit visibility.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button size="sm" variant="outline" icon={RefreshCw} onClick={fetchAdminData}>
            Refresh Analytics
          </Button>
          <Badge role="Platform Admin" />
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #f8d5d5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        {['Overview', 'User & Role Directory', 'Security Audit Logs'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'Overview' && (
        <>
          <div className="grid-4">
            <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-primary-deep)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <Users size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                    {analytics?.users?.total || 5} Accounts
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>5 Roles Enforced</div>
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
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Service Categories</div>
                </div>
              </div>
            </div>

            <div className="card-care" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-sand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                  <CheckSquare size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, lineHeight: 1.1 }}>
                    {analytics?.providers?.pending || 0} Pending
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Verifications Queue</div>
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
                    ₹{analytics?.financials?.totalGMV || 0}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Total GMV Volume</div>
                </div>
              </div>
            </div>
          </div>

          <Card title="Global Platform Governance & Controls" subtitle="System authorization rules and multi-role RBAC enforcement">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)' }}>
                <StatusIndicator status="Active" />
                <span style={{ fontSize: '0.9375rem', color: 'var(--color-primary-deep)', fontWeight: 600 }}>
                  Platform Admin role active with global authorization rights across Customer, Service Provider, Operations Manager, Support Agent, and Admin modules.
                </span>
              </div>

              <div className="grid-3" style={{ marginTop: '0.5rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Service Requests</div>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)' }}>{analytics?.requests?.total || 0} Total</div>
                  <div style={{ fontSize: '0.78125rem', color: 'var(--color-primary)' }}>{analytics?.requests?.open || 0} Open | {analytics?.requests?.completed || 0} Completed</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Active Bookings</div>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)' }}>{analytics?.bookings?.total || 0} Total</div>
                  <div style={{ fontSize: '0.78125rem', color: 'var(--color-primary)' }}>{analytics?.bookings?.active || 0} Active | {analytics?.bookings?.fulfilled || 0} Fulfilled</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Platform Revenue (Fees)</div>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-accent)' }}>₹{analytics?.financials?.platformFees || 0}</div>
                  <div style={{ fontSize: '0.78125rem', color: 'var(--color-text-muted)' }}>From {analytics?.financials?.paidInvoicesCount || 0} Paid Invoices</div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Tab 2: User & Role Directory */}
      {activeTab === 'User & Role Directory' && (
        <Card title="User & Role Directory" subtitle="Account directory is unavailable until a protected user-list API is provided.">
          <div className="data-state"><div className="empty-mark"><Users/></div><h3>No user directory endpoint is configured</h3><p>This workspace has no API for listing platform users. Account records are intentionally not fabricated in the dashboard.</p></div>
        </Card>
      )}

      {/* Tab 3: Security Audit Logs */}
      {activeTab === 'Security Audit Logs' && (
        <Card title="Security & Audit Trail Log Inspection" subtitle="Immutable audit log records for system actions and administrative events">
          {auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              No audit logs recorded yet. Create requests, accept quotes, or perform admin actions to generate audit logs.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {auditLogs.map((log) => (
                <div key={log._id} style={{ padding: '0.875rem 1.125rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9375rem', color: 'var(--color-primary-deep)' }}>Action: {log.action}</strong>
                    <div style={{ fontSize: '0.78125rem', color: 'var(--color-text-muted)' }}>
                      Actor: {log.actor?.name || 'System User'} ({log.role}) | Entity: {log.targetEntity || 'System'}{log.ipAddress ? ` | IP: ${log.ipAddress}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <Badge variant="success">Recorded</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
