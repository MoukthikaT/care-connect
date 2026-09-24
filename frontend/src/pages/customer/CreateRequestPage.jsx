import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import AIIndicator from '../../components/common/AIIndicator';
import api from '../../services/api';
import { Sparkles, MapPin, Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export const CreateRequestPage = () => {
  const [searchParams] = useSearchParams();
  const initialProblem = searchParams.get('problem') || '';

  const [title, setTitle] = useState(initialProblem ? initialProblem.slice(0, 50) : '');
  const [description, setDescription] = useState(initialProblem);
  const [address, setAddress] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [urgency, setUrgency] = useState('Normal');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Live AI Preview State
  const [aiPreview, setAiPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialProblem) {
      handleDescriptionChange({ target: { value: initialProblem } });
    }
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
        if (res.data.categories.length > 0) {
          setSelectedCategory(res.data.categories[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleDescriptionChange = async (e) => {
    const val = e.target.value;
    setDescription(val);
    setAiPreview(null);
    if (val.trim().length < 9) return;
    try {
      const { data } = await api.post('/requests/classify-preview', { description: val });
      setAiPreview(data.aiAnalysis);
      if (data.aiAnalysis.categoryId) setSelectedCategory(data.aiAnalysis.categoryId);
      setUrgency(data.aiAnalysis.urgency || 'Normal');
    } catch (err) {
      setError(err.response?.data?.message || 'Request classification is temporarily unavailable. You can still select a category and continue.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !address.trim() || !selectedCategory || !Number.isFinite(Number(longitude)) || !Number.isFinite(Number(latitude))) {
      setError('Please provide a title, description, active category, service address, longitude, and latitude.');
      return;
    }

    const lngNum = parseFloat(longitude);
    const latNum = parseFloat(latitude);

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180 || isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError('Invalid coordinates. Longitude must be -180..180 and Latitude -90..90.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        categoryId: selectedCategory,
        urgency,
        preferredSchedule: { date, timeSlot },
        location: {
          address: address.trim(),
          coordinates: {
            type: 'Point',
            coordinates: [lngNum, latNum]
          }
        }
      };

      const res = await api.post('/requests', payload);
      if (res.data.success) {
        navigate('/dashboard/customer/requests');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post service request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Intelligent Request Creator
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Tell us what your home needs
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Describe your repair or maintenance problem in plain words for instant AI triage and provider matching.
          </p>
        </div>
        <AIIndicator variant="badge" />
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #f8d5d5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="grid-3" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        {/* Main Request Form */}
        <Card title="Service Request Information">
          <form onSubmit={handleSubmit}>
            <Input
              label="Request Headline"
              placeholder="e.g., Water leaking under kitchen sink pipe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="form-group">
              <label className="form-label">
                Problem Description (Free-text for AI Triage) <span style={{ color: 'var(--color-accent)' }}>*</span>
              </label>
              <textarea
                className="form-input"
                rows="4"
                placeholder="Explain the issue in detail (e.g. AC unit is humming but cold air is not flowing properly. Room temperature is rising)..."
                value={description}
                onChange={handleDescriptionChange}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Service Category</label>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Urgency Level</label>
                <select
                  className="form-select"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                >
                  <option value="Normal">Normal (Routine Schedule)</option>
                  <option value="High">High Priority (Within 24 Hrs)</option>
                  <option value="Emergency">Emergency (Immediate Callout)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <MapPin size={18} color="var(--color-accent)" /> Location & Preferred Schedule
              </h4>
              <Input
                label="Street Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
              <div className="grid-2">
                <Input label="Preferred Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Input label="Time Window" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} />
              </div>
            </div>

            <Button type="submit" loading={submitting} variant="accent" icon={ArrowRight} style={{ width: '100%', marginTop: '1.5rem' }}>
              Submit Request & Match Verified Pros
            </Button>
          </form>
        </Card>

        {/* AI Classifier Live Inspector Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="CareConnect AI Triage" variant="ai">
            {aiPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-ai)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    CLASSIFICATION CONFIDENCE
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-ai)', backgroundColor: 'var(--color-ai-light)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                    {Math.round((aiPreview.confidenceScore || 0) * 100)}%
                  </span>
                </div>

                <div style={{ padding: '0.875rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Suggested Category</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary-deep)', marginTop: '0.15rem' }}>
                    {aiPreview.suggestedCategory}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary-deep)', marginBottom: '0.375rem' }}>Extracted Skill Tags:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {aiPreview.detectedSkills.length > 0 ? aiPreview.detectedSkills.map((s, i) => (
                      <Badge key={i} variant="ai">{s}</Badge>
                    )) : <span style={{ color: 'var(--color-text-muted)', fontSize: '.8rem' }}>No specific skills detected.</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Assigned Urgency:</span>
                  <Badge variant={aiPreview.urgency === 'Emergency' ? 'danger' : 'warning'}>
                    {aiPreview.urgency}
                  </Badge>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
                <Sparkles size={32} color="var(--color-ai)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.84375rem', lineHeight: 1.5 }}>
                  Classification appears here when the service returns an analysis for your description.
                </p>
              </div>
            )}
          </Card>

          <Card variant="cream">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--color-primary-deep)', fontSize: '0.875rem' }}>
              <ShieldCheck size={18} color="var(--color-success)" /> Verified Pro Dispatch
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Your request is matched to providers using service area, skills, and availability information on file.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestPage;
