import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <main className="legal-page">
      <div className="legal-header">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last Updated: February 2026</p>
        </div>
      </div>

      <div className="container">
        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              Scribbles Learning Center ("we," "our," or "us"), located at 725 River Road, Suite 103,
              Edgewater, New Jersey 07020, operates the Scribbles Learning Center website, parent portal,
              and mobile application (collectively, the "Services"). This Privacy Policy explains how we
              collect, use, store, and protect information from parents, guardians, and families who use
              our Services.
            </p>
            <p>
              By using our Services, you agree to the collection and use of information in accordance
              with this Privacy Policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We collect the following types of information to provide our childcare management services:</p>

            <h3>Parent/Guardian Information</h3>
            <ul>
              <li>Full name, email address, and phone number</li>
              <li>Home address</li>
              <li>Employer name and work phone number</li>
              <li>Account credentials (email and encrypted password)</li>
            </ul>

            <h3>Child Information</h3>
            <ul>
              <li>Full name and date of birth</li>
              <li>Allergies and medical notes</li>
              <li>Optional profile photos of enrolled children uploaded by parents/guardians for identification purposes</li>
              <li>Program enrollment information</li>
              <li>Attendance and check-in/check-out records</li>
              <li>Absence reports</li>
            </ul>

            <h3>Emergency Contact & Authorized Pickup Information</h3>
            <ul>
              <li>Names, phone numbers, and relationships of emergency contacts</li>
              <li>Names, phone numbers, and relationships of authorized pickup persons</li>
            </ul>

            <h3>Usage Information</h3>
            <ul>
              <li>Messages exchanged between parents and administrators through our platform</li>
              <li>Notification delivery and read status</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li>Managing daily childcare operations including attendance tracking, check-in/check-out, and absence management</li>
              <li>Facilitating communication between parents and center administrators</li>
              <li>Ensuring child safety through authorized pickup verification at our kiosk system</li>
              <li>Maintaining emergency contact information for child safety</li>
              <li>Sending notifications regarding your child's care and center announcements</li>
              <li>Providing parent portal and mobile app functionality</li>
              <li>Generating attendance reports for operational and regulatory purposes</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Children's Privacy (COPPA Compliance)</h2>
            <p>
              We are committed to complying with the Children's Online Privacy Protection Act (COPPA).
              Our Services are intended for use by parents and guardians, not by children directly.
            </p>
            <ul>
              <li>We do not knowingly collect personal information directly from children under 13</li>
              <li>All child information is provided and managed by parents or authorized guardians</li>
              <li>Parents have the right to review, update, or request deletion of their child's information at any time</li>
              <li>Child photographs are uploaded only by parents or center administrators with parental consent</li>
              <li>We do not use child information for advertising, marketing, or any purpose unrelated to childcare services</li>
            </ul>
            <p>
              If you believe we have inadvertently collected information from a child under 13 without
              parental consent, please contact us immediately at{' '}
              <a href="mailto:info@scribbleslearning.com">info@scribbleslearning.com</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Children's Photos and Images</h2>
            <p>
              At Scribbles Learning Center, we collect photos of enrolled children solely for identification
              and safety purposes. This section explains how we handle children's images in compliance with
              the Children's Online Privacy Protection Act (COPPA).
            </p>

            <h3>What We Collect</h3>
            <ul>
              <li>Profile photos of enrolled children uploaded by parents/guardians</li>
              <li>Photos are used for child identification during check-in/check-out and by authorized staff</li>
            </ul>

            <h3>Parental Consent</h3>
            <ul>
              <li>Only parents or legal guardians may upload photos of their children</li>
              <li>By uploading a photo, the parent/guardian provides verifiable consent</li>
              <li>Parents may withdraw consent at any time by deleting the photo or contacting us</li>
            </ul>

            <h3>How Photos Are Stored</h3>
            <ul>
              <li>Photos are securely stored using Amazon Web Services (AWS) S3 with encryption</li>
              <li>Access is restricted to authenticated parents/guardians and authorized daycare staff only</li>
              <li>Photos are never shared publicly or with third parties</li>
            </ul>

            <h3>Who Can Access Photos</h3>
            <ul>
              <li>The child's parent(s)/guardian(s) who have linked accounts</li>
              <li>Authorized daycare staff for identification purposes</li>
              <li>Authorized pickup persons (view only during pickup verification)</li>
            </ul>

            <h3>Retention and Deletion</h3>
            <ul>
              <li>Photos are retained only while the child is actively enrolled</li>
              <li>Upon disenrollment or account deletion, photos are permanently deleted within 30 days</li>
              <li>Parents may delete their child's photo at any time through the Parent Portal or mobile app</li>
            </ul>

            <h3>Your Rights</h3>
            <ul>
              <li>Request to view what photos we have stored</li>
              <li>Request deletion of photos at any time</li>
              <li>Withdraw consent for photo storage</li>
              <li>Request a copy of stored photos</li>
            </ul>

            <p>
              For any questions about children's photos or to exercise your rights, contact us at{' '}
              <a href="mailto:info@scribbleslearning.com">info@scribbleslearning.com</a> or call (201) 945-9445.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Data Storage and Security</h2>
            <p>We take the security of your data seriously and implement the following measures:</p>
            <ul>
              <li>All data is stored in a secure PostgreSQL database hosted on encrypted cloud infrastructure</li>
              <li>Passwords are hashed using industry-standard bcrypt encryption and are never stored in plain text</li>
              <li>All data transmitted between your device and our servers is encrypted using HTTPS/TLS</li>
              <li>Authentication is managed through secure JSON Web Tokens (JWT) with automatic expiration</li>
              <li>Access to personal data is restricted to authorized center administrators on a need-to-know basis</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Third-Party Services</h2>
            <p>We use the following third-party services in the operation of our platform:</p>
            <ul>
              <li>
                <strong>Amazon Web Services (AWS) S3</strong> - Used solely for secure storage of
                uploaded photographs (child profile photos). AWS maintains its own comprehensive
                security and privacy practices.
              </li>
              <li>
                <strong>Railway</strong> - Cloud hosting platform for our application servers and database.
              </li>
            </ul>
            <p>
              We do not sell, trade, rent, or share your personal information with third parties for
              marketing or advertising purposes. Your data is used exclusively for providing our
              childcare management services.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Your Rights</h2>
            <p>As a user of our Services, you have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> You may view your personal information and your children's information through the parent portal or mobile app at any time</li>
              <li><strong>Correction:</strong> You may update or correct your information through your account settings</li>
              <li><strong>Deletion:</strong> You may request deletion of your account and all associated data through the "Delete Account" feature in your account settings. This action is permanent and cannot be undone.</li>
              <li><strong>Data Export:</strong> You may request a copy of your data by contacting us at <a href="mailto:info@scribbleslearning.com">info@scribbleslearning.com</a></li>
              <li><strong>Communication Preferences:</strong> You may manage your notification preferences through the app</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active and your child
              is enrolled at our center. Upon account deletion:
            </p>
            <ul>
              <li>Your profile, account credentials, and personal information are permanently deleted</li>
              <li>Children linked solely to your account are removed along with their records</li>
              <li>Historical attendance records may be retained in anonymized form for operational and regulatory compliance</li>
              <li>Messages and notifications associated with your account are deleted</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or applicable laws. We will notify you of material changes through the parent portal,
              mobile app, or email. Your continued use of our Services after changes are posted
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices,
              please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:info@scribbleslearning.com">info@scribbleslearning.com</a></li>
              <li><strong>Phone:</strong> (201) 945-9445</li>
              <li><strong>Address:</strong> Scribbles Learning Center, 725 River Road, Suite 103, Edgewater, NJ 07020</li>
            </ul>
          </section>

          <div className="legal-footer-links">
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
