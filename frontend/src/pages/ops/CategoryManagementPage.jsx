import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import StatusIndicator from '../../components/common/StatusIndicator';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { Plus, Search, Layers, Edit, Power, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';

export const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'wrench',
    subcategories: []
  });
  const [newSub, setNewSub] = useState({ name: '', estimatedBasePrice: '', requiredSkills: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories?includeInactive=true');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cat = null) => {
    setError('');
    setSuccess('');
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        description: cat.description || '',
        icon: cat.icon || 'wrench',
        subcategories: cat.subcategories || []
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        icon: 'wrench',
        subcategories: []
      });
    }
    setNewSub({ name: '', estimatedBasePrice: '', requiredSkills: '' });
    setIsModalOpen(true);
  };

  const handleAddSubcategory = () => {
    if (!newSub.name.trim()) return;
    const skillsArray = newSub.requiredSkills
      ? newSub.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const sub = {
      name: newSub.name.trim(),
      estimatedBasePrice: Number(newSub.estimatedBasePrice) || 0,
      requiredSkills: skillsArray
    };

    if (formData.subcategories.some(s => s.name.toLowerCase() === sub.name.toLowerCase())) {
      setError(`Subcategory '${sub.name}' is already added.`);
      return;
    }

    setFormData({
      ...formData,
      subcategories: [...formData.subcategories, sub]
    });
    setNewSub({ name: '', estimatedBasePrice: '', requiredSkills: '' });
  };

  const handleRemoveSubcategory = (index) => {
    const updated = [...formData.subcategories];
    updated.splice(index, 1);
    setFormData({ ...formData, subcategories: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory._id}`, formData);
        setSuccess(`Category '${res.data.category.name}' updated successfully.`);
      } else {
        const res = await api.post('/categories', formData);
        setSuccess(`Category '${res.data.category.name}' created successfully.`);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    }
  };

  const handleToggleActive = async (catId) => {
    try {
      const res = await api.patch(`/categories/${catId}/deactivate`);
      setSuccess(res.data.message);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle category state.');
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Domain Rules & Base Pricing
          </div>
          <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
            Category & Skill Domain Management
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Configure home service domains, required skill sets, and base rates.
          </p>
        </div>
        <Button variant="accent" icon={Plus} onClick={() => handleOpenModal()}>
          Create New Category Domain
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

      {/* Filter Bar */}
      <div style={{ maxWidth: '600px' }}>
        <Input
          placeholder="Search category domains by name or description..."
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Category List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>Loading Service Categories...</div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No service categories found"
          description="Get started by creating your first service category domain."
          actionText="Create Category"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <div className="grid-2">
          {filteredCategories.map(cat => (
            <div key={cat._id} className="card-care" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.375rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400 }}>
                      {cat.name}
                    </h3>
                    <p style={{ fontSize: '0.84375rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                      {cat.description || 'No description provided'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="outline" size="sm" icon={Edit} onClick={() => handleOpenModal(cat)}>Edit</Button>
                    <Button
                      variant={cat.isActive ? 'danger' : 'secondary'}
                      size="sm"
                      icon={Power}
                      onClick={() => handleToggleActive(cat._id)}
                    >
                      {cat.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <StatusIndicator status={cat.isActive ? 'Active' : 'Suspended'} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                    {cat.subcategories?.length || 0} Subcategories Configured
                  </span>
                </div>

                {/* Subcategories list */}
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary-deep)', letterSpacing: '0.05em' }}>
                      Subcategories & Required Skills:
                    </div>
                    {cat.subcategories.map((sub, sIdx) => (
                      <div key={sIdx} style={{ backgroundColor: 'var(--color-cream)', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary-deep)' }}>{sub.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Skills: {sub.requiredSkills?.join(', ') || 'General'}
                          </div>
                        </div>
                        <Badge variant="info">₹{sub.estimatedBasePrice}/hr base</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Service Category Domain' : 'Create Service Category Domain'}
        maxWidth="620px"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Category Name"
            placeholder="e.g. Plumbing Services"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Description"
            placeholder="Brief overview of category scope"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {/* Subcategory Creator Widget */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary-deep)', fontWeight: 400, marginBottom: '0.75rem' }}>
              Add Subcategory & Required Skills
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--color-cream)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-sand)', marginBottom: '1rem' }}>
              <div className="grid-2">
                <Input
                  label="Subcategory Name"
                  placeholder="e.g. Pipe Leak Repair"
                  value={newSub.name}
                  onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                />
                <Input
                  label="Estimated Base Price (₹/hr)"
                  type="number"
                  placeholder="499"
                  value={newSub.estimatedBasePrice}
                  onChange={(e) => setNewSub({ ...newSub, estimatedBasePrice: e.target.value })}
                />
              </div>
              <Input
                label="Required Skills (Comma-separated)"
                placeholder="Pipe Repair, Leak Sealing, Soldering"
                value={newSub.requiredSkills}
                onChange={(e) => setNewSub({ ...newSub, requiredSkills: e.target.value })}
              />
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddSubcategory}>
                Add Subcategory Item
              </Button>
            </div>

            {/* List of draft subcategories */}
            {formData.subcategories.map((sub, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                <div>
                  <strong style={{ color: 'var(--color-primary-deep)' }}>{sub.name}</strong> (₹{sub.estimatedBasePrice}/hr)
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Skills: {sub.requiredSkills?.join(', ')}</div>
                </div>
                <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveSubcategory(i)}>Remove</Button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="accent">Save Category Domain</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryManagementPage;
