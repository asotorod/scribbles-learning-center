// nodemailer is treated as an optional dependency: if it isn't installed,
// email notifications are disabled but the server runs normally.
// To enable: `npm install nodemailer` inside server/ (and commit the
// package.json + package-lock.json changes).
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch {
  console.warn('emailService: nodemailer not installed, email notifications disabled');
}

// SMTP configuration comes entirely from environment variables so no
// credentials ever live in the codebase.
//
// Required env vars (set in Railway):
//   SMTP_HOST          e.g. smtp.aol.com
//   SMTP_PORT          e.g. 465
//   SMTP_USER          the AOL email address
//   SMTP_PASS          an AOL *app password* (not the regular login password)
//   CONTACT_NOTIFY_TO  where notifications go (defaults to SMTP_USER)
//
// If SMTP_HOST/USER/PASS are missing, email sending is silently disabled
// (form submissions still work and appear in the admin dashboard).

const isConfigured = () =>
  Boolean(nodemailer && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // SSL for 465, STARTTLS for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

// Basic HTML escaping so user-submitted content can't inject markup
const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatEasternTime = (date = new Date()) =>
  date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

/**
 * Send a notification email for a new contact form inquiry.
 * Never throws — errors are logged so a mail outage can't break the form.
 */
const sendContactNotification = async ({ name, email, phone, subject, message }) => {
  if (!isConfigured()) {
    console.warn('emailService: SMTP not configured, skipping contact notification');
    return;
  }

  const to = process.env.CONTACT_NOTIFY_TO || process.env.SMTP_USER;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br/>');
  const receivedAt = formatEasternTime();

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #7C8B6F; color: #ffffff; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">New Contact Inquiry &mdash; Scribbles Learning Center</h2>
      </div>
      <div style="border: 1px solid #e5e0d5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; width: 110px; vertical-align: top;">Name</td>
            <td style="padding: 6px 0; color: #111827;"><strong>${safeName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; vertical-align: top;">Email</td>
            <td style="padding: 6px 0;"><a href="mailto:${safeEmail}" style="color: #7C8B6F;">${safeEmail}</a></td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 6px 0; color: #6b7280; vertical-align: top;">Phone</td>
            <td style="padding: 6px 0; color: #111827;">${safePhone}</td>
          </tr>` : ''}
          ${subject ? `
          <tr>
            <td style="padding: 6px 0; color: #6b7280; vertical-align: top;">Subject</td>
            <td style="padding: 6px 0; color: #111827;">${safeSubject}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; color: #6b7280; vertical-align: top;">Received</td>
            <td style="padding: 6px 0; color: #111827;">${receivedAt} (ET)</td>
          </tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #f8f6f1; border-radius: 6px; font-size: 14px; color: #111827; line-height: 1.6;">
          ${safeMessage}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
          Reply directly to this email to respond to ${safeName}.
          This inquiry is also available in the admin dashboard under Inquiries.
        </p>
      </div>
    </div>`;

  const text = [
    'New Contact Inquiry - Scribbles Learning Center',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    subject ? `Subject: ${subject}` : null,
    `Received: ${receivedAt} (ET)`,
    '',
    'Message:',
    message,
  ].filter(Boolean).join('\n');

  try {
    await getTransporter().sendMail({
      // AOL requires the From address to match the authenticated account
      from: `"Scribbles Website" <${process.env.SMTP_USER}>`,
      to,
      replyTo: `"${String(name || '').replace(/"/g, '')}" <${email}>`,
      subject: `New Website Inquiry from ${name}${subject ? ` — ${subject}` : ''}`,
      text,
      html,
    });
    console.log(`emailService: contact notification sent to ${to}`);
  } catch (err) {
    // Log but never throw — the inquiry is already saved in the database
    console.error('emailService: failed to send contact notification:', err.message);
  }
};

module.exports = { sendContactNotification };
