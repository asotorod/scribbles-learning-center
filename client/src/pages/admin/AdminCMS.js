import React, { useState, useEffect, useCallback } from 'react';
import { contentAPI, galleryAPI } from '../../services/api';
import './AdminCMS.css';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About' },
  { key: 'contact', label: 'Contact' },
  { key: 'careers', label: 'Careers' },
  { key: 'curriculum', label: 'Curriculum' },
  { key: 'gallery', label: 'Gallery' },
];

const formatLabel = (key) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const AdminCMS = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [content, setContent] = useState({});
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gallery state
  const [images, setImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [galleryForm, setGalleryForm] = useState({ imageUrl: '', captionEn: '', captionEs: '', category: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contentAPI.getAll();
      setContent(res.data?.data?.content || {});
    } catch (err) {
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGallery = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const res = await galleryAPI.getAll();
      setImages(res.data?.data?.images || []);
    } catch (err) {
      setError('Failed to load gallery');
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchGallery();
    }
  }, [activeTab, fetchGallery]);

  // Content editing
  const getFieldKey = (page, section, key) => `${page}.${section}.${key}`;

  const getEditValue = (page, section, key) => {
    const fk = getFieldKey(page, section, key);
    if (fk in edits) return edits[fk];
    return content[page]?.[section]?.[key]?.en || '';
  };

  const handleEdit = (page, section, key, value) => {
    setEdits(prev => ({ ...prev, [getFieldKey(page, section, key)]: value }));
  };

  const handleSave = async (page, section, key) => {
    const fk = getFieldKey(page, section, key);
    const value = edits[fk];
    if (value === undefined) return;

    setSaving(prev => ({ ...prev, [fk]: true }));
    try {
      await contentAPI.update(page, section, key, { en: value });
      // Update local content state
      setContent(prev => ({
        ...prev,
        [page]: {
          ...prev[page],
          [section]: {
            ...prev[page]?.[section],
            [key]: { ...prev[page]?.[section]?.[key], en: value }
          }
        }
      }));
      // Remove from edits
      setEdits(prev => { const n = { ...prev }; delete n[fk]; return n; });
      // Flash saved
      setSaved(prev => ({ ...prev, [fk]: true }));
      setTimeout(() => setSaved(prev => { const n = { ...prev }; delete n[fk]; return n; }), 2000);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(prev => { const n = { ...prev }; delete n[fk]; return n; });
    }
  };

  // Gallery CRUD
  const handleGalleryAdd = () => {
    setEditingImage(null);
    setGalleryForm({ imageUrl: '', captionEn: '', captionEs: '', category: '' });
    setShowGalleryModal(true);
  };

  const handleGalleryEdit = (img) => {
    setEditingImage(img);
    setGalleryForm({
      imageUrl: img.imageUrl || img.image_url || '',
      captionEn: img.captionEn || img.caption_en || '',
      captionEs: img.captionEs || img.caption_es || '',
      category: img.category || '',
    });
    setShowGalleryModal(true);
  };

  const handleGallerySave = async (e) => {
    e.preventDefault();
    if (!galleryForm.imageUrl.trim()) return;
    try {
      const data = {
        imageUrl: galleryForm.imageUrl,
        captionEn: galleryForm.captionEn,
        captionEs: galleryForm.captionEs,
        category: galleryForm.category,
      };
      if (editingImage) {
        await galleryAPI.update(editingImage.id, data);
      } else {
        await galleryAPI.add(data);
      }
      setShowGalleryModal(false);
      fetchGallery();
    } catch (err) {
      setError('Failed to save image');
    }
  };

  const handleGalleryDelete = async (id) => {
    try {
      await galleryAPI.delete(id);
      setConfirmDelete(null);
      fetchGallery();
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  const categories = [...new Set(images.map(i => i.category || i.caption_en).filter(Boolean))];

  // Render content sections
  const renderContentTab = (page) => {
    const pageContent = content[page];
    if (loading) return <div className="cms-loading">Loading content...</div>;
    if (!pageContent || Object.keys(pageContent).length === 0) {
      return <div className="cms-empty">No content found for this page. Content will appear here once seeded in the database.</div>;
    }

    return (
      <div className="cms-content-sections">
        {Object.entries(pageContent).map(([section, fields]) => (
          <div key={section} className="cms-section">
            <div className="cms-section-header">
              <h3>{formatLabel(section)}</h3>
            </div>
            <div className="cms-section-fields">
              {Object.entries(fields).map(([key, data]) => {
                const fk = getFieldKey(page, section, key);
                const value = getEditValue(page, section, key);
                const hasChanges = fk in edits;
                const isLong = (data.en || '').length > 80;
                return (
                  <div key={key} className="cms-field">
                    <label className="cms-field-label">{formatLabel(key)}</label>
                    <div className="cms-field-input">
                      {isLong ? (
                        <textarea
                          value={value}
                          onChange={(e) => handleEdit(page, section, key, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleEdit(page, section, key, e.target.value)}
                        />
                      )}
                      <div className="cms-field-actions">
                        {hasChanges && (
                          <button
                            className="cms-save-btn"
                            onClick={() => handleSave(page, section, key)}
                            disabled={saving[fk]}
                          >
                            {saving[fk] ? 'Saving...' : 'Save'}
                          </button>
                        )}
                        {saved[fk] && <span className="cms-saved">Saved</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGalleryTab = () => {
    if (galleryLoading) return <div className="cms-loading">Loading gallery...</div>;
    return (
      <div className="cms-gallery">
        <div className="cms-gallery-toolbar">
          <span className="cms-gallery-count">{images.length} image{images.length !== 1 ? 's' : ''}</span>
          <button className="hr-btn-primary" onClick={handleGalleryAdd}>+ Add Image</button>
        </div>
        {images.length === 0 ? (
          <div className="cms-empty">No gallery images yet. Click "Add Image" to get started.</div>
        ) : (
          <div className="cms-gallery-grid">
            {images.map((img) => (
              <div key={img.id} className="cms-gallery-card">
                <div className="cms-gallery-preview">
                  <img src={img.imageUrl || img.image_url} alt={img.captionEn || img.caption_en || 'Gallery'} />
                </div>
                <div className="cms-gallery-info">
                  <p className="cms-gallery-caption">{img.captionEn || img.caption_en || 'No caption'}</p>
                  {(img.category) && <span className="cms-gallery-category">{img.category}</span>}
                </div>
                <div className="cms-gallery-actions">
                  <button className="hr-btn-sm" onClick={() => handleGalleryEdit(img)}>Edit</button>
                  {confirmDelete === img.id ? (
                    <>
                      <button className="hr-btn-danger hr-btn-sm" onClick={() => handleGalleryDelete(img.id)}>Confirm</button>
                      <button className="hr-btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="hr-btn-sm" onClick={() => setConfirmDelete(img.id)}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gallery Modal */}
        {showGalleryModal && (
          <div className="hr-modal-overlay" onClick={() => setShowGalleryModal(false)}>
            <div className="hr-modal" onClick={e => e.stopPropagation()}>
              <div className="hr-modal-header">
                <h2>{editingImage ? 'Edit Image' : 'Add Image'}</h2>
                <button className="hr-modal-close" onClick={() => setShowGalleryModal(false)}>✕</button>
              </div>
              <form onSubmit={handleGallerySave}>
                <div className="hr-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="hr-form-group">
                    <label>Image URL *</label>
                    <input
                      type="text"
                      required
                      value={galleryForm.imageUrl}
                      onChange={(e) => setGalleryForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  {galleryForm.imageUrl && (
                    <div className="cms-modal-preview">
                      <img src={galleryForm.imageUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                  <div className="hr-form-group">
                    <label>Caption (English)</label>
                    <input
                      type="text"
                      value={galleryForm.captionEn}
                      onChange={(e) => setGalleryForm(prev => ({ ...prev, captionEn: e.target.value }))}
                    />
                  </div>
                  <div className="hr-form-group">
                    <label>Caption (Spanish)</label>
                    <input
                      type="text"
                      value={galleryForm.captionEs}
                      onChange={(e) => setGalleryForm(prev => ({ ...prev, captionEs: e.target.value }))}
                    />
                  </div>
                  <div className="hr-form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={galleryForm.category}
                      onChange={(e) => setGalleryForm(prev => ({ ...prev, category: e.target.value }))}
                      list="gallery-categories"
                      placeholder="e.g., Classroom, Outdoor, Events"
                    />
                    <datalist id="gallery-categories">
                      {categories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
                <div className="hr-modal-footer">
                  <button type="button" className="hr-btn-secondary" onClick={() => setShowGalleryModal(false)}>Cancel</button>
                  <button type="submit" className="hr-btn-primary">{editingImage ? 'Update' : 'Add Image'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-cms">
      <div className="admin-page-header">
        <div>
          <h1>Content Management</h1>
          <p>Edit website content, gallery, and testimonials</p>
        </div>
      </div>

      {error && (
        <div className="hr-error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="hr-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`hr-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'gallery' ? renderGalleryTab() : renderContentTab(activeTab)}
    </div>
  );
};

export default AdminCMS;
