import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import { contentAPI } from '../services/api';
import './Gallery.css';

const Gallery = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await contentAPI.getSection('gallery');
        setGallery(response.data);
      } catch (error) {
        console.error('Error fetching gallery:', error);
        setGallery(defaultGallery);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const openLightbox = (image) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <main>
      <Hero
        title="Gallery"
        subtitle="Take a peek inside our learning center"
        backgroundImage="https://images.unsplash.com/photo-1526662092594-e98c1e356d6a?w=1920"
        size="medium"
        ctaPrimary="Schedule a Tour"
        ctaPrimaryLink="/contact"
      />

      <section className="section">
        <div className="container">
          <div className="gallery-intro">
            <p>See the magic happen! Browse through photos of our classrooms, activities, and the happy faces at Scribbles Learning Center.</p>
          </div>

          {loading ? (
            <div className="gallery-loading">Loading gallery...</div>
          ) : (
            <div className="gallery-grid">
              {gallery.map((item) => (
                <div 
                  key={item.id} 
                  className="gallery-item"
                  onClick={() => openLightbox(item)}
                >
                  <img src={item.image} alt={item.caption} />
                  <div className="gallery-item-overlay">
                    <span>{item.caption}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.image} alt={selectedImage.caption} />
            <p className="lightbox-caption">{selectedImage.caption}</p>
          </div>
        </div>
      )}

      {/* Virtual Tour CTA */}
      <section className="section section-cream">
        <div className="container">
          <div className="virtual-tour-cta">
            <h2>Want to See More?</h2>
            <p>Schedule an in-person tour to experience Scribbles firsthand and meet our wonderful staff!</p>
            <a href="/contact" className="btn btn-primary">Schedule a Tour</a>
          </div>
        </div>
      </section>
    </main>
  );
};

const defaultGallery = [
  { id: 1, image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600", caption: "Learning through play" },
  { id: 2, image: "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=600", caption: "Our infant room" },
  { id: 3, image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600", caption: "Art time" },
  { id: 4, image: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=600", caption: "Circle time" },
  { id: 5, image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600", caption: "Reading corner" },
  { id: 6, image: "https://images.unsplash.com/photo-1526662092594-e98c1e356d6a?w=600", caption: "Outdoor play" }
];

export default Gallery;
