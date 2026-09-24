import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import {
  Search,
  Filter,
  Star,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  Droplets,
  Zap,
  Wind,
  Wrench,
  Cog,
  Check
} from 'lucide-react';

export const ServicesCatalogPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedServiceDetail, setSelectedServiceDetail] = useState(null);
  
  // Multi-step Booking Drawer State
  const [bookingService, setBookingService] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [urgency, setUrgency] = useState('Normal');
  
  // Submit state
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Pre-select category if passed in URL query e.g. /services?category=Plumbing
  useEffect(() => {
    const catQuery = searchParams.get('category');
    if (catQuery) {
      setSelectedCategoryFilter(catQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Failed to load service categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper icon renderer based on string name
  const getCategoryIcon = (iconName) => {
    switch (iconName?.toLowerCase()) {
      case 'droplets':
      case 'plumbing':
        return <Droplets size={22} color="#FF6A3D" />;
      case 'zap':
      case 'electrical':
        return <Zap size={22} color="#F4DB7D" />;
      case 'sparkles':
      case 'cleaning':
        return <Sparkles size={22} color="#9DAAF2" />;
      case 'wind':
      case 'hvac':
        return <Wind size={22} color="#FF6A3D" />;
      case 'cog':
      case 'appliance':
        return <Cog size={22} color="#9DAAF2" />;
      case 'wrench':
      default:
        return <Wrench size={22} color="#FF6A3D" />;
    }
  };

  // Flatten subcategories to produce catalog items
  const catalogItems = [];
  categories.forEach(cat => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      cat.subcategories.forEach(sub => {
        catalogItems.push({
          id: sub._id || `${cat._id}-${sub.name}`,
          name: sub.name,
          categoryName: cat.name,
          categoryId: cat._id,
          categoryIcon: cat.icon,
          description: sub.description || cat.description,
          price: sub.price ?? sub.estimatedBasePrice,
          originalPrice: sub.originalPrice,
          estimatedDuration: sub.estimatedDuration,
          rating: sub.rating,
          reviewCount: sub.reviewCount,
          inclusions: sub.inclusions || [],
          highlights: sub.highlights || [],
          unit: sub.unit,
          requiredSkills: sub.requiredSkills || []
        });
      });
    }
  });

  // Filter items based on Category tab and Search query
  const filteredItems = catalogItems.filter(item => {
    const matchesCategory = selectedCategoryFilter === 'All' ||
      item.categoryName.toLowerCase().includes(selectedCategoryFilter.toLowerCase()) ||
      selectedCategoryFilter.toLowerCase().includes(item.categoryName.toLowerCase());

    const matchesSearch = searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const availableTimeSlots = [
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '01:00 PM - 03:00 PM',
    '03:00 PM - 05:00 PM',
    '05:00 PM - 07:00 PM'
  ];

  const handleStartBooking = (item) => {
    if (!isAuthenticated) {
      // Prompt user to sign in
      navigate('/login?redirect=/services');
      return;
    }
    setBookingService(item);
    setBookingStep(1);
    setQuantity(1);
    setBookingError('');
    setBookingSuccess(null);
  };

  const handleConfirmBookingSubmit = async () => {
    if (!bookingService) return;
    setSubmittingBooking(true);
    setBookingError('');

    try {
      const lngNum = Number(longitude);
      const latNum = Number(latitude);
      if (!address.trim() || !city.trim() || longitude.trim() === '' || latitude.trim() === '' || !Number.isFinite(lngNum) || !Number.isFinite(latNum)) {
        setBookingError('Enter your service address, city, longitude, and latitude to continue.');
        return;
      }

      const fullAddress = `${address}, ${city}`;
      const payload = {
        title: `${bookingService.name} (${quantity}x)`,
        description: `Marketplace Booking: ${bookingService.name}. Details: ${bookingService.description}. Customer Instructions: ${specialInstructions || 'None'}`,
        categoryId: bookingService.categoryId,
        urgency: urgency,
        preferredSchedule: {
          date: bookingDate,
          timeSlot: selectedTimeSlot
        },
        location: {
          address: fullAddress,
          coordinates: {
            type: 'Point',
            coordinates: [lngNum, latNum]
          }
        }
      };

      const res = await api.post('/requests', payload);

      if (res.data.success) {
        setBookingSuccess({
          requestId: res.data.serviceRequest?._id,
          bookingNumber: res.data.serviceRequest?._id,
          title: bookingService.name,
          date: bookingDate,
          timeSlot: selectedTimeSlot,
          totalPrice: Number.isFinite(bookingService.price) && bookingService.price > 0 ? (bookingService.price * quantity).toFixed(2) : null
        });
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-deep) 0%, var(--color-primary) 100%)',
        color: 'white',
        borderRadius: 'var(--radius-xl)',
        padding: '3.5rem 2.5rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }} className="bg-connection-pattern">
        <div style={{ maxWidth: '820px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--color-cream)',
            fontSize: '0.8125rem',
            fontWeight: 800,
            marginBottom: '1.25rem'
          }}>
            <ShieldCheck size={16} color="var(--color-accent)" /> Verified provider workflow
          </div>

          <h1 style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', fontFamily: 'var(--font-serif)', fontWeight: 400, lineHeight: 1.15, marginBottom: '0.875rem', color: '#ffffff' }}>
            Book Verified Home Services & Repairs
          </h1>

          <p style={{ fontSize: '1.0625rem', color: 'rgba(255, 255, 255, 0.82)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Review service information, send your request, and compare provider quotes before choosing a professional.
          </p>

          {/* Search Box Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.75rem',
            boxShadow: 'var(--shadow-md)',
            maxWidth: '680px',
            border: '1px solid var(--border-color)'
          }}>
            <Search size={22} color="var(--color-text-muted)" style={{ margin: '0 0.75rem' }} />
            <input
              type="text"
              placeholder="What does your home need today? (e.g. pipe leak, AC service, deep clean)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.9375rem',
                color: 'var(--color-text-dark)',
                padding: '0.625rem 0'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => { setSelectedCategoryFilter('All'); setSearchParams({}); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              border: selectedCategoryFilter === 'All' ? '2px solid #FF6A3D' : '1px solid var(--border-color)',
              backgroundColor: selectedCategoryFilter === 'All' ? '#FF6A3D' : 'var(--bg-surface)',
              color: selectedCategoryFilter === 'All' ? 'white' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            All Services ({catalogItems.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryFilter.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat._id}
                onClick={() => { setSelectedCategoryFilter(cat.name); setSearchParams({ category: cat.name }); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '2px solid #FF6A3D' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? '#1A2238' : 'var(--bg-surface)',
                  color: isSelected ? 'white' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {getCategoryIcon(cat.icon)}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1A2238' }}>
            {selectedCategoryFilter === 'All' ? 'Available Home Service Packages' : `${selectedCategoryFilter} Packages`}
          </h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {filteredItems.length} service{filteredItems.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <Sparkles size={36} className="animate-spin" style={{ color: '#FF6A3D', marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>Fetching live service catalog...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <AlertCircle size={40} color="#FF6A3D" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A2238', marginBottom: '0.5rem' }}>
              No services match your filter
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
              Try searching with another keyword or pick a different category.
            </p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('All'); setSearchParams({}); }}>
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div className="grid-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                hoverable
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Category & Badge Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        padding: '0.375rem',
                        backgroundColor: '#f0f3ff',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {getCategoryIcon(item.categoryIcon)}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9DAAF2', textTransform: 'uppercase' }}>
                        {item.categoryName}
                      </span>
                    </div>

                    {item.highlights && item.highlights.length > 0 && (
                      <span style={{
                        backgroundColor: '#fffdf2',
                        border: '1px solid #fef08a',
                        color: '#854d0e',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.6875rem',
                        fontWeight: 700
                      }}>
                        {item.highlights[0]}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: '#1A2238', marginBottom: '0.375rem', lineHeight: 1.3 }}>
                    {item.name}
                  </h3>

                  {/* Rating & Duration */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.875rem' }}>
                    {item.rating != null && item.reviewCount != null && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 700, color: '#854d0e' }}>
                      <Star size={14} fill="#F4DB7D" color="#d97706" />
                      <span>{item.rating}</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({item.reviewCount})</span>
                    </div>}

                    {item.estimatedDuration && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      <Clock size={14} />
                      <span>{item.estimatedDuration}</span>
                    </div>}
                  </div>

                  {/* Short Description */}
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {item.description}
                  </p>

                  {/* Inclusions Quick Preview */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1A2238', marginBottom: '0.375rem' }}>Key Inclusions:</div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {item.inclusions.slice(0, 2).map((inc, i) => (
                        <li key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Pricing & Actions */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Number(item.price) > 0 ? 'Starting at' : 'Pricing'}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1A2238' }}>
                          {Number(item.price) > 0 ? `$${item.price}` : 'Quote required'}
                        </span>
                        {Number(item.originalPrice) > 0 && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>${item.originalPrice}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedServiceDetail(item)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FF6A3D',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      View Details <ChevronRight size={14} />
                    </button>
                  </div>

                  <Button
                    onClick={() => handleStartBooking(item)}
                    icon={ArrowRight}
                    style={{ width: '100%', backgroundColor: '#FF6A3D' }}
                  >
                    Book Service Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Service Detail Modal */}
      {selectedServiceDetail && (
        <div className="modal-overlay" onClick={() => setSelectedServiceDetail(null)}>
          <div className="modal-container animate-fade-in" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF6A3D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedServiceDetail.categoryName}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1A2238' }}>{selectedServiceDetail.name}</h2>
              </div>
              <button
                onClick={() => setSelectedServiceDetail(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {(selectedServiceDetail.rating != null || selectedServiceDetail.estimatedDuration) && <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: '#f0f3ff', borderRadius: 'var(--radius-md)' }}>
              {selectedServiceDetail.rating != null && selectedServiceDetail.reviewCount != null && <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, fontSize: '0.875rem' }}><Star size={16} fill="var(--color-accent)" color="var(--color-accent)" /> {selectedServiceDetail.rating} ({selectedServiceDetail.reviewCount} reviews)</div>}
              {selectedServiceDetail.estimatedDuration && <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}><Clock size={16} /> {selectedServiceDetail.estimatedDuration}</div>}
            </div>}

            <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {selectedServiceDetail.description}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1A2238', marginBottom: '0.75rem' }}>
                Included in Package:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedServiceDetail.inclusions.map((inc, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              backgroundColor: '#fffdf2',
              border: '1px solid #fef08a',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.75rem'
            }}>
              <ShieldCheck size={24} color="#854d0e" />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#854d0e' }}>Provider verification</div>
                <div style={{ fontSize: '0.75rem', color: '#a16207' }}>Provider verification details are available in the service workflow.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Number(selectedServiceDetail.price) > 0 ? 'Starting price' : 'Pricing'}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1A2238' }}>{Number(selectedServiceDetail.price) > 0 ? `$${selectedServiceDetail.price}` : 'Quote required'}</div>
              </div>
              <Button
                onClick={() => {
                  const item = selectedServiceDetail;
                  setSelectedServiceDetail(null);
                  handleStartBooking(item);
                }}
                icon={ArrowRight}
                style={{ backgroundColor: '#FF6A3D' }}
              >
                Proceed to Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Interactive Booking Drawer / Modal */}
      {bookingService && (
        <div className="modal-overlay" onClick={() => !submittingBooking && setBookingService(null)}>
          <div className="modal-container animate-fade-in" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF6A3D', textTransform: 'uppercase' }}>
                  CareConnect Booking • Step {bookingSuccess ? '4' : bookingStep} of 4
                </div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#1A2238' }}>
                  {bookingSuccess ? 'Booking Confirmed!' : `Book ${bookingService.name}`}
                </h2>
              </div>
              {!submittingBooking && (
                <button
                  onClick={() => setBookingService(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Stepper Indicator */}
            {!bookingSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                {[
                  { num: 1, label: 'Service' },
                  { num: 2, label: 'Schedule' },
                  { num: 3, label: 'Location' },
                  { num: 4, label: 'Summary' }
                ].map((s) => (
                  <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: bookingStep >= s.num ? '#FF6A3D' : '#e2e8f0',
                      color: bookingStep >= s.num ? 'white' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {bookingStep > s.num ? <Check size={14} /> : s.num}
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: bookingStep === s.num ? 700 : 500, color: bookingStep === s.num ? '#1A2238' : 'var(--text-muted)' }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {bookingError && (
              <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} /> {bookingError}
              </div>
            )}

            {/* STEP 1: SERVICE & QUANTITY */}
            {bookingStep === 1 && !bookingSuccess && (
              <div>
                <Card style={{ backgroundColor: '#f8fafc', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1A2238' }}>{bookingService.name}</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{bookingService.estimatedDuration} • ${bookingService.price} / {bookingService.unit}</p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#1A2238', padding: '0.25rem' }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '0.9375rem', minWidth: '20px', textAlign: 'center' }}>{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#1A2238', padding: '0.25rem' }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </Card>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Urgency Level</label>
                  <select
                    className="form-input"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                  >
                    <option value="Normal">Normal (Standard Booking)</option>
                    <option value="High">High Priority (Within 24 Hours)</option>
                    <option value="Emergency">Emergency (Immediate Callout)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subtotal</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1A2238' }}>${(bookingService.price * quantity).toFixed(2)}</div>
                  </div>
                  <Button onClick={() => setBookingStep(2)} icon={ArrowRight} style={{ backgroundColor: '#FF6A3D' }}>
                    Continue to Schedule
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: DATE & TIME SLOT */}
            {bookingStep === 2 && !bookingSuccess && (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Select Preferred Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.625rem' }}>Available Time Slots</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {availableTimeSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTimeSlot(slot)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: selectedTimeSlot === slot ? '2px solid #FF6A3D' : '1px solid var(--border-color)',
                          backgroundColor: selectedTimeSlot === slot ? '#fff0ec' : 'var(--bg-surface)',
                          color: selectedTimeSlot === slot ? '#c2410c' : 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                  <Button variant="outline" onClick={() => setBookingStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setBookingStep(3)} icon={ArrowRight} style={{ backgroundColor: '#FF6A3D' }}>
                    Continue to Location
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION & ADDRESS */}
            {bookingStep === 3 && !bookingSuccess && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <Input
                    label="Street Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <Input
                    label="City & Zip"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input className="form-input" value={user?.phone || ''} readOnly style={{ backgroundColor: '#f1f5f9' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Special Instructions for Service Professional</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="e.g., Gate code is #402, please ring bell twice or call before arrival..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                  <Button variant="outline" onClick={() => setBookingStep(2)}>
                    Back
                  </Button>
                  <Button onClick={() => setBookingStep(4)} icon={ArrowRight} style={{ backgroundColor: '#FF6A3D' }}>
                    Review Booking Summary
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: BOOKING SUMMARY CART PANEL & CONFIRMATION */}
            {bookingStep === 4 && !bookingSuccess && (
              <div>
                <Card style={{ backgroundColor: '#f8fafc', marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1A2238', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Booking Summary
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <span>{bookingService.name} ({quantity}x)</span>
                    <span style={{ fontWeight: 700 }}>${(bookingService.price * quantity).toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                    <span>Scheduled Date & Time</span>
                    <span style={{ fontWeight: 600, color: '#1A2238' }}>{bookingDate} • {selectedTimeSlot}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                    <span>Service Location</span>
                    <span style={{ fontWeight: 600, color: '#1A2238' }}>{address}, {city}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>CareConnect Platform & Warranty Fee</span>
                    <span style={{ fontWeight: 600, color: '#10b981' }}>FREE</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1A2238' }}>Total Payable Amount</span>
                    <span style={{ fontSize: '1.375rem', fontWeight: 800, color: '#FF6A3D' }}>
                      ${(bookingService.price * quantity).toFixed(2)}
                    </span>
                  </div>
                </Card>

                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} /> Pay after completion • Covered by CareConnect Warranty
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button variant="outline" onClick={() => setBookingStep(3)} disabled={submittingBooking}>
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmBookingSubmit}
                    loading={submittingBooking}
                    icon={Check}
                    style={{ backgroundColor: '#FF6A3D' }}
                  >
                    Confirm & Dispatch Booking
                  </Button>
                </div>
              </div>
            )}

            {/* CONFIRMATION SUCCESS VIEW */}
            {bookingSuccess && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <CheckCircle2 size={36} />
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1A2238', marginBottom: '0.5rem' }}>
                  Service Booking Confirmed!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
                  Booking Reference: <strong style={{ color: '#1A2238' }}>{bookingSuccess.bookingNumber}</strong>
                </p>

                <Card style={{ textAlign: 'left', backgroundColor: '#f8fafc', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Service Item:</span>
                    <span style={{ fontWeight: 700, color: '#1A2238' }}>{bookingSuccess.title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Date & Slot:</span>
                    <span style={{ fontWeight: 600 }}>{bookingSuccess.date} ({bookingSuccess.timeSlot})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Agreed Rate:</span>
                    <span style={{ fontWeight: 800, color: '#FF6A3D' }}>${bookingSuccess.totalPrice}</span>
                  </div>
                </Card>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <Button
                    onClick={() => {
                      setBookingService(null);
                      navigate('/dashboard/customer/requests');
                    }}
                    icon={ArrowRight}
                    style={{ backgroundColor: '#FF6A3D' }}
                  >
                    Track Booking in My Requests
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesCatalogPage;
