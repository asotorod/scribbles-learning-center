import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const TermsOfService = () => {
  return (
    <main className="legal-page">
      <div className="legal-header">
        <div className="container">
          <h1>Terms of Service</h1>
          <p className="legal-updated">Last Updated: February 2026</p>
        </div>
      </div>

      <div className="container">
        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Scribbles Learning Center website, parent portal, or mobile
              application (collectively, the "Services"), you agree to be bound by these Terms of
              Service ("Terms"). If you do not agree to these Terms, please do not use our Services.
            </p>
            <p>
              These Services are operated by Scribbles Learning Center, located at 725 River Road,
              Suite 103, Edgewater, New Jersey 07020.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of Service</h2>
            <p>
              Scribbles Learning Center provides a digital platform for parents and guardians of
              enrolled children to manage their childcare experience. Our Services include:
            </p>
            <ul>
              <li>Parent portal and mobile app for managing your account and child information</li>
              <li>Attendance tracking and daily check-in/check-out management</li>
              <li>Absence reporting and management</li>
              <li>Direct messaging between parents and center administrators</li>
              <li>Emergency contact and authorized pickup person management</li>
              <li>Push notifications and center announcements</li>
              <li>Kiosk-based check-in system at our facility</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. User Accounts</h2>
            <p>To access our Services, you must have an account created by Scribbles Learning Center administration.</p>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to provide accurate, current, and complete information</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>Account sharing is prohibited; each parent or guardian should have their own account</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>PIN codes used for kiosk check-in must be kept confidential</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Acceptable Use</h2>
            <p>When using our Services, you agree to:</p>
            <ul>
              <li>Provide accurate and truthful information about yourself and your children</li>
              <li>Use the messaging system only for communications related to your child's care</li>
              <li>Keep authorized pickup and emergency contact information current and accurate</li>
              <li>Not attempt to access accounts or information belonging to other users</li>
              <li>Not use the Services for any unlawful or unauthorized purpose</li>
              <li>Not attempt to interfere with or disrupt the Services or servers</li>
              <li>Not upload malicious content, viruses, or harmful code</li>
              <li>Respect the privacy of other families, children, and staff members</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Children's Data</h2>
            <p>
              Our Services involve the management of information about children enrolled at our
              center. In compliance with the Children's Online Privacy Protection Act (COPPA):
            </p>
            <ul>
              <li>Only parents and authorized guardians may provide information about children</li>
              <li>Children are not permitted to directly access or use our digital Services</li>
              <li>Parents maintain full control over their children's information and may review, update, or delete it at any time</li>
              <li>We use children's information solely for providing childcare services</li>
              <li>Photos uploaded to child profiles are stored securely and used only within our platform</li>
            </ul>
            <p>
              For full details on how we handle children's data, please review our{' '}
              <Link to="/privacy-policy">Privacy Policy</Link>.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Intellectual Property</h2>
            <p>
              The Services, including all content, features, functionality, design, text, graphics,
              logos, and software, are owned by Scribbles Learning Center and are protected by
              copyright, trademark, and other intellectual property laws.
            </p>
            <ul>
              <li>You may not copy, modify, distribute, or create derivative works from our Services</li>
              <li>The Scribbles Learning Center name, logo, and related branding are our trademarks</li>
              <li>You retain ownership of any content you upload (such as child photographs)</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law:
            </p>
            <ul>
              <li>Our Services are provided "as is" and "as available" without warranties of any kind</li>
              <li>We do not guarantee that the Services will be uninterrupted, error-free, or secure at all times</li>
              <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Our total liability shall not exceed the amount you have paid us in the twelve months preceding the claim</li>
              <li>We are not responsible for the actions or inactions of authorized pickup persons designated by you</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Account Termination</h2>
            <p>
              You may delete your account at any time through the account settings in the parent
              portal or mobile app. Account deletion will permanently remove your profile, associated
              data, and children linked exclusively to your account.
            </p>
            <p>
              We reserve the right to suspend or terminate your account if:
            </p>
            <ul>
              <li>You violate these Terms of Service</li>
              <li>Your child is no longer enrolled at Scribbles Learning Center</li>
              <li>We determine that your use of the Services poses a risk to other users or the platform</li>
              <li>Required by law or regulation</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of
              material changes through the parent portal, mobile app, or email. Your continued use
              of the Services after changes are posted constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of New Jersey, without regard to its conflict of law provisions. Any disputes
              arising from these Terms or your use of the Services shall be resolved in the courts
              of Bergen County, New Jersey.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:info@scribbleslearning.com">info@scribbleslearning.com</a></li>
              <li><strong>Phone:</strong> (201) 945-9445</li>
              <li><strong>Address:</strong> Scribbles Learning Center, 725 River Road, Suite 103, Edgewater, NJ 07020</li>
            </ul>
          </section>

          <div className="legal-footer-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TermsOfService;
