import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import AIIndicator from '../../components/common/AIIndicator';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { Briefcase, DollarSign, Calendar, MapPin, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export const JobOpportunitiesPage = () => {
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Submit Quote Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState('');
  const [durationHours, setDurationHours] = useState('1');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMatchedRequests();
  }, []);

  const fetchMatchedRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests/matched');
      if (res.data.success) {
        setMatchedRequests(res.data.requests);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load matched opportunities.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuoteModal = (reqDoc) => {
    setSelectedRequest(reqDoc);
    setEstimatedCost('');
    setDurationHours('1');
    setNotes('');
    setError('');
    setSuccess('');
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    if (!estimatedCost || Number(estimatedCost) <= 0) {
      setError('Please provide a valid estimated cost.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        serviceRequest: selectedRequest._id,
        estimatedCost: Number(estimatedCost),
        estimatedDurationHours: Number(durationHours) || 1,
        notes: notes.trim()
      };

      const res = await api.post('/quotes', payload);
      if (res.data.success) {
        setSuccess(`Quote of $${estimatedCost} submitted successfully for "${selectedRequest.title}".`);
        setSelectedRequest(null);
        fetchMatchedRequests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quote.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Provider Dispatch Queue
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Matched Job Opportunities
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Customer requests matched to your verified skills and service radius by CareConnect AI.
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>Searching for matched jobs...</div>
      ) : matchedRequests.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No matched opportunities right now"
          description="Make sure your provider profile is verified and skills/service radius are updated in Profile & Verification."
        />
      ) : (
        <div className="grid-2">
          {matchedRequests.map(reqDoc => (
            <div key={reqDoc._id} className="card-care" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                      {reqDoc.category?.name || 'General Repair'}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
                      {reqDoc.title}
                    </h3>
                  </div>
                  <AIIndicator variant="match-badge" confidence={94} />
                </div>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {reqDoc.description}
                </p>

                {reqDoc.aiAnalysis?.detectedSkills?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
                    {reqDoc.aiAnalysis.detectedSkills.map((skill, sIdx) => (
                      <Badge key={sIdx} variant="ai">{skill}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={14} color="var(--color-primary)" /> {reqDoc.location?.address}
                </div>
                <Button size="sm" variant="accent" icon={DollarSign} onClick={() => handleOpenQuoteModal(reqDoc)}>
                  Submit Proposal Quote
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Quote Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={`Submit Quote: ${selectedRequest?.title}`}
      >
        <form onSubmit={handleQuoteSubmit}>
          <Input
            label="Estimated Total Cost ($)"
            type="number"
            icon={DollarSign}
            placeholder="120"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            required
          />

          <Input
            label="Estimated Duration (Hours)"
            type="number"
            placeholder="2"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            required
          />

          <div className="form-group">
            <label className="form-label">Proposal Scope Notes & Guarantee Details</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Explain what is included in your quote (e.g. Includes materials, diagnostics, and 30-day warranty)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button type="submit" loading={submitting} variant="accent">Submit Proposal to Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JobOpportunitiesPage;
