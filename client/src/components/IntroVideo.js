import React, { useState, useRef, useEffect } from 'react';
import './IntroVideo.css';

const IntroVideo = ({ onComplete }) => {
  const [show, setShow] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    // Check if intro was already shown this session
    const hasSeenVideo = sessionStorage.getItem('scribbles_intro_seen');
    if (hasSeenVideo) {
      onComplete();
      return;
    }
    setShow(true);
  }, [onComplete]);

  const handleClose = () => {
    const overlay = document.querySelector('.intro-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        sessionStorage.setItem('scribbles_intro_seen', 'true');
        setShow(false);
        onComplete();
      }, 500);
    } else {
      sessionStorage.setItem('scribbles_intro_seen', 'true');
      setShow(false);
      onComplete();
    }
  };

  const handleVideoEnd = () => {
    handleClose();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (!show) return null;

  return (
    <div className="intro-overlay">
      <video
        ref={videoRef}
        className="intro-video"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
      >
        <source src="/intro-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <button className="intro-btn unmute-btn" onClick={toggleMute}>
        {isMuted ? (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
            <span>Unmute</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <span>Mute</span>
          </>
        )}
      </button>

      <button className="intro-btn skip-btn" onClick={handleClose}>
        Skip Intro
      </button>
    </div>
  );
};

export default IntroVideo;
