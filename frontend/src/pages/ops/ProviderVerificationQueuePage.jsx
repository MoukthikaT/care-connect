import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import StatusIndicator from '../../components/common/StatusIndicator';
import Input from '../../components/common/Input';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { CheckSquare, CheckCircle2, XCircle, FileText, ExternalLink, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';

export const ProviderVerificationQueuePage = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected Profile Modal State
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchVerifications(activeTab);
  }, [activeTab]);

  const fetchVerifications = async (status) => {
    try {
      setLoading(true);
      const res = await api.get(`/providers/verifications/pending?status=${status}`);
      if (res.data.success) {
        setVerifications(res.data.verifications);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load verification queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profileId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/providers/${profileId}/verify`, {
        status: 'Verified'
      });
      setSuccess(res.data.message);
      setSelectedProfile(null);
      fetchVerifications(activeTab);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve verification.');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }

    try {
      const res = await api.patch(`/providers/${selectedProfile._id}/verify`, {
        status: 'Rejected',
        rejectionReason: rejectionReason.trim()
      });
      setSuccess(res.data.message);
      setRejectModalOpen(false);
      setSelectedProfile(null);
      setRejectionReason('');
      fetchVerifications(activeTab);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject verification.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Provider Credentials Oversight
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Provider Verification Queue
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Review provider trade credentials, uploaded Cloudinary documents, and approve platform dispatch authorization.
          </p>
        </div>
        <Badge role="Operations Manager" />
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
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        {['Pending', 'Verified', 'Rejected'].map(status => (
          <button
            key={status}
            className={`btn ${activeTab === status ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab(status)}
          >
            {status} Applications
          </button>
        ))}
      </div>

      {/* Verification List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>Loading Verification Queue...</div>
      ) : verifications.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={`No ${activeTab.toLowerCase()} verification requests`}
          description={`There are currently no provider profiles under the '${activeTab}' status.`}
        />
      ) : (
        <div className="grid-2">
          {verifications.map(profile => (
            <div key={profile._id} className="card-care" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
                      {profile.businessName || profile.user?.name || 'Service Provider'}
                    </h3>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      Email: {profile.user?.email || 'N/A'}
                    </div>
                  </div>
                  <StatusIndicator status={profile.verificationStatus} />
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-dark)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{profile.bio || 'No bio provided.'}</p>
                  <div><strong>Base Rate:</strong> ${profile.hourlyRate || 45}/hr</div>
                  <div><strong>Skills:</strong> {profile.skills?.join(', ') || 'General'}</div>
                  <div><strong>Submitted Credentials:</strong> {profile.verificationDocuments?.length || 0} Cloudinary Files</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button size="sm" variant="outline" icon={FileText} onClick={() => setSelectedProfile(profile)}>
                  Inspect Documents & Geo Radius
                </Button>
                {profile.verificationStatus === 'Pending' && (
                  <Button size="sm" variant="accent" icon={CheckCircle2} onClick={() => handleApprove(profile._id)}>
                    Approve Provider
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Review Modal */}
      <Modal
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        title={`Verification Audit: ${selectedProfile?.user?.name || 'Provider'}`}
        maxWidth="620px"
      >
        {selectedProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)' }}>
              <h4 style={{ fontWeight: 800, color: 'var(--color-primary-deep)', fontSize: '0.9375rem' }}>Applicant Information</h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-dark)', marginTop: '0.35rem' }}>
                Name: <strong>{selectedProfile.user?.name}</strong> • Email: {selectedProfile.user?.email} • Phone: {selectedProfile.user?.phone}
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: 800, color: 'var(--color-primary-deep)', fontSize: '0.9375rem' }}>Capabilities & Base Rate</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Skills: {selectedProfile.skills?.join(', ') || 'None'}<br />
                Configured Rate: ${selectedProfile.hourlyRate}/hr
              </p>
            </div>

            {/* Service Area GeoJSON */}
            {selectedProfile.serviceAreas && selectedProfile.serviceAreas.length > 0 && (
              <div>
                <h4 style={{ fontWeight: 800, color: 'var(--color-primary-deep)', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <MapPin size={16} color="var(--color-accent)" /> GeoJSON Service Radius
                </h4>
                {selectedProfile.serviceAreas.map((area, idx) => (
                  <div key={idx} style={{ fontSize: '0.8125rem', backgroundColor: 'var(--color-cream)', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', marginTop: '0.375rem', border: '1px solid var(--color-sand)' }}>
                    {area.cityName && <>City: <strong>{area.cityName}</strong> | </>}Center: [{area.center?.coordinates?.join(', ')}] | Radius: <strong>{area.radiusInKm} km</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Cloudinary Documents List */}
            <div>
              <h4 style={{ fontWeight: 800, color: 'var(--color-primary-deep)', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Uploaded Verification Documents</h4>
              {selectedProfile.verificationDocuments?.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No documents uploaded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedProfile.verificationDocuments.map((doc, dIdx) => (
                    <div key={dIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)' }}>
                      <div>
                        <strong style={{ color: 'var(--color-primary-deep)' }}>{doc.docName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                        View Credentials File <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedProfile.verificationStatus === 'Pending' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Button variant="danger" icon={XCircle} onClick={() => setRejectModalOpen(true)}>
                  Reject Verification
                </Button>
                <Button variant="accent" icon={CheckCircle2} onClick={() => handleApprove(selectedProfile._id)}>
                  Approve & Authorize Provider
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Verification Request"
      >
        <form onSubmit={handleRejectSubmit}>
          <Input
            label="Reason for Rejection"
            placeholder="e.g., License expired or document image unreadable"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger">Confirm Rejection</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProviderVerificationQueuePage;
