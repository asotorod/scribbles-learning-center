import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import './PhotoConsentModal.css';

const PhotoConsentModal = ({ isOpen, onClose, onAgree, childName, loading }) => {
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    if (agreed) {
      onAgree();
    }
  };

  const handleClose = () => {
    setAgreed(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Photo Upload Consent"
      size="medium"
      className="photo-consent-modal"
    >
      <div className="consent-content">
        <p className="consent-intro">
          By uploading a photo of your child, you acknowledge and agree to the following:
        </p>

        <ul className="consent-list">
          <li>
            This photo will be used to help our staff identify your child during check-in,
            check-out, and daily activities.
          </li>
          <li>
            The photo will be securely stored and only visible to:
            <ul className="consent-sublist">
              <li>You and linked family members</li>
              <li>Authorized Scribbles Learning Center staff</li>
              <li>Authorized pickup persons you have designated</li>
            </ul>
          </li>
          <li>
            The photo will <strong>NOT</strong> be shared publicly or with any third parties.
          </li>
          <li>
            You may delete this photo at any time through your account settings.
          </li>
          <li>
            Upon disenrollment, your child's photo will be permanently deleted within 30 days.
          </li>
        </ul>

        <label className="consent-checkbox">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={loading}
          />
          <span className="checkbox-text">
            I am the parent or legal guardian of {childName || 'this child'} and I consent to
            uploading and storing this photo for identification purposes.
          </span>
        </label>
      </div>

      <div className="consent-actions">
        <Button variant="ghost" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAgree}
          disabled={!agreed || loading}
          loading={loading}
        >
          I Agree & Continue
        </Button>
      </div>
    </Modal>
  );
};

export default PhotoConsentModal;
