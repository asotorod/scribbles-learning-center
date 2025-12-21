import React, { useState } from 'react';
import Hero from '../components/Hero';
import './Gallery.css';

// Default gallery with daycare stock images
const defaultGallery = [
  { id: 1, image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600", caption: "Learning through play" },
  { id: 2, image: "https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=600", caption: "Creative activities" },
  { id: 3, image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600", caption: "Art time fun" },
  { id: 4, image: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=600", caption: "Circle time" },
  { id: 5, image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600", caption: "Reading corner" },
  { id: 6, image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=600", caption: "Building blocks" },
  { id: 7, image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600", caption: "Outdoor playground" },
  { id: 8, image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600", caption: "Music and movement" },
  { id: 9, image: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=600", caption: "Snack time" }
];

const Gallery = () => {
  const [gallery] = useState(defaultGallery);
  const [selectedImage, setSelectedImage] = useState(null);

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
        backgroundImage="https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=1920"
        size="medium"
        ctaPrimary="Schedule a Tour"
        ctaPrimaryLink="/contact"
      />

      <section className="section">
        <div className="container">
          <div className="gallery-intro">
            <p>See the magic happen! Browse through photos of our classrooms, activities, and the happy faces at Scribbles Learning Center.</p>
          </div>

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

export default Gallery;
