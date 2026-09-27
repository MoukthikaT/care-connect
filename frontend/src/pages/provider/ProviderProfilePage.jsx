import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';
import api from '../../services/api';
import { User, Wrench, MapPin, Upload, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, DollarSign, Star, Award, Briefcase } from 'lucide-react';

export const ProviderProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States
  const [bio, setBio] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isAvailableForEmergency, setIsAvailableForEmergency] = useState(false);

  // GeoJSON Service Area State
  const [cityName, setCityName] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [radiusInKm, setRadiusInKm] = useState('');

  // Document Upload State
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchProfileAndCategories();
  }, []);

  const fetchProfileAndCategories = async () => {
    try {
      setLoading(true);
      const [profileRes, catRes] = await Promise.all([
        api.get('/providers/profile/me'),
        api.get('/categories')
      ]);

      if (profileRes.data.success) {
        const p = profileRes.data.profile;
        setProfile(p);
        setBio(p.bio || '');
        setBusinessName(p.businessName || '');
        setHourlyRate(p.hourlyRate ? String(p.hourlyRate) : '');
        setSelectedSkills(p.skills || []);
        setIsAvailableForEmergency(p.isAvailableForEmergency || false);

        if (p.serviceAreas && p.serviceAreas.length > 0) {
          const area = p.serviceAreas[0];
          setCityName(area.cityName || '');
          if (area.center?.coordinates) {
            setLongitude(String(area.center.coordinates[0]));
            setLatitude(String(area.center.coordinates[1]));
          }
          setRadiusInKm(area.radiusInKm ? String(area.radiusInKm) : '');
        }
      }

      if (catRes.data.success) {
        setCategories(catRes.data.categories);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSkill = (skillName) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const lngNum = parseFloat(longitude);
    const latNum = parseFloat(latitude);
    const radNum = parseFloat(radiusInKm);

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setError('Invalid Longitude. Must be a number between -180 and 180.');
      setSaving(false);
      return;
    }

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError('Invalid Latitude. Must be a number between -90 and 90.');
      setSaving(false);
      return;
    }

    if (isNaN(radNum) || radNum <= 0) {
      setError('Invalid Radius. Must be a positive number in km.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        bio,
        businessName,
        hourlyRate: Number(hourlyRate),
        skills: selectedSkills,
        isAvailableForEmergency,
        serviceAreas: [
          {
            cityName,
            center: {
              type: 'Point',
              coordinates: [lngNum, latNum]
            },
            radiusInKm: radNum
          }
        ]
      };

      const res = await api.put('/providers/profile', payload);
      setProfile(res.data.profile);
      setSuccess('Provider profile & service area updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!docName.trim()) {
      setError('Please specify a document name (e.g., Trade License, Insurance).');
      return;
    }
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('docName', docName.trim());
    formData.append('file', file);

    try {
      const res = await api.post('/providers/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Document uploaded successfully to Cloudinary! Submitted to Ops Manager queue for verification.');
      setDocName('');
      setFile(null);
      fetchProfileAndCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document to Cloudinary.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>Loading Provider Profile...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* PREMIUM PROFILE HEADER */}
      <div
        className="card-care"
        style={{
          backgroundColor: 'var(--color-primary-deep)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div aria-hidden="true" style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid var(--color-accent)', display:'grid',placeItems:'center',background:'rgba(255,255,255,.12)',fontSize:'1.6rem',fontWeight:800 }}>{(profile?.businessName || 'P').charAt(0).toUpperCase()}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.2rem' }}>
              <h1 style={{ fontSize: '1.875rem', fontFamily: 'var(--font-serif)', color: '#ffffff', fontWeight: 400 }}>
                {profile?.businessName || 'Your provider profile'}
              </h1>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-success)', color: '#ffffff', fontWeight: 800 }}>
                {profile?.verificationStatus === 'Verified' ? '✓ Verified Pro' : `Verification ${profile?.verificationStatus || 'Pending'}`}
              </span>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
              {[...(profile?.skills || []), cityName && `${radiusInKm} km service area`].filter(Boolean).join(' • ') || 'Add your services and service area to complete your profile.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>Customer Rating</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
              {profile?.rating?.count > 0 ? <><Star size={16} fill="var(--color-accent)" /> {profile.rating.average} ({profile.rating.count})</> : 'No customer reviews yet'}
            </div>
          </div>
          <StatusIndicator status={profile?.verificationStatus || 'Pending'} />
        </div>
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

      {/* Main Grid: Business Profile Left, Credentials & GeoJSON Right */}
      <div className="grid-2">
        {/* Left Column: Business Profile Form */}
        <Card title="Business Profile & Service Rate">
          <form onSubmit={handleSaveProfile}>
            <Input
              label="Business Name / Brand Title"
              icon={User}
              placeholder="e.g., Rahul Sharma Electrical & HVAC"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />

            <Input
              label="Hourly Service Rate (₹/hr)"
              type="number"
              icon={DollarSign}
              placeholder="65"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              required
            />

            <div className="form-group">
              <label className="form-label">Professional Bio / Overview</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Describe your qualifications, background checks, tools, and service guarantees..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div style={{ margin: '1rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, color: 'var(--color-primary-deep)', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={isAvailableForEmergency}
                  onChange={(e) => setIsAvailableForEmergency(e.target.checked)}
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                Available for 24/7 Emergency Calls
              </label>
            </div>

            {/* Skills Selector */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                Select Provider Verified Skill Badges:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', padding: '0.75rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)' }}>
                {categories.flatMap(c => c.subcategories).map((sub, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`btn btn-sm ${selectedSkills.includes(sub.name) ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleToggleSkill(sub.name)}
                  >
                    {selectedSkills.includes(sub.name) ? '✓ ' : '+ '} {sub.name}
                  </button>
                ))}
              </div>
            </div>

            {/* GeoJSON Service Area Configurator */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <MapPin size={18} color="var(--color-accent)" /> GeoJSON Service Area Coverage
              </h4>
              <Input
                label="Primary Service City"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
              />
              <div className="grid-2">
                <Input
                  label="Center Longitude"
                  placeholder="-74.0060"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
                <Input
                  label="Center Latitude"
                  placeholder="40.7128"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <Input
                label="Coverage Radius (in Kilometers)"
                type="number"
                placeholder="25"
                value={radiusInKm}
                onChange={(e) => setRadiusInKm(e.target.value)}
              />
            </div>

            <Button type="submit" loading={saving} variant="accent" style={{ width: '100%', marginTop: '1.5rem' }}>
              Save Profile & Service Radius
            </Button>
          </form>
        </Card>

        {/* Right Column: Verification Credentials & Cloudinary Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="Upload Verification Document" subtitle="Upload license or ID credentials">
            <form onSubmit={handleFileUpload}>
              <Input
                label="Document Title"
                placeholder="e.g., Master Electrical License, General Liability Cert"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                required
              />

              <div className="form-group">
                <label className="form-label">Select File (JPG, PNG, PDF)</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept="image/*,.pdf"
                  required
                />
              </div>

              <Button type="submit" loading={uploading} variant="primary" icon={Upload} style={{ width: '100%' }}>
                Upload Document to Cloudinary
              </Button>
            </form>
          </Card>

          {/* Uploaded Documents List */}
          <Card title="Submitted Trade Documents">
            {profile?.verificationDocuments?.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                No documents uploaded yet. Upload your trade license or certification to request verified badge status.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {profile?.verificationDocuments.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', backgroundColor: 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)' }}>
                    <div>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--color-primary-deep)' }}>{doc.docName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                      View File <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfilePage;
