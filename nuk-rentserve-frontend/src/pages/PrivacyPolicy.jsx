import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="wrap page" style={{ maxWidth: '920px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="badge" style={{ backgroundColor: 'var(--blue-light)', color: 'var(--navy)', fontWeight: '800', padding: '4px 12px', borderRadius: '4px' }}>
          LEGAL & COMPLIANCE
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--navy)', marginTop: '12px', marginBottom: '8px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Effective Date: 1 May 2025 · Last Updated: 17 November 2026 · Digital Personal Data Protection Act (DPDP), 2023 Compliant
        </p>
      </div>

      <div className="card" style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)', lineHeight: '1.7', fontSize: '15px', color: '#334155' }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
            1. Introduction & Scope
          </h2>
          <p>
            Welcome to <b>NUK RentServe</b> ("we", "our", or "us"). We are committed to protecting the privacy, confidentiality, and security of our users across Uttara Karnataka and the wider state of Karnataka. This Privacy Policy governs your use of the NUK RentServe website and Android mobile application, in strict compliance with the <b>Digital Personal Data Protection Act, 2023 (DPDP Act)</b>, the <b>Information Technology Act, 2000</b>, and applicable data protection rules.
          </p>
          <p>
            NUK RentServe operates as a community marketplace connecting customers with verified property owners, student rental partners, local trade professionals (such as electricians, plumbers, and carpenters), and independent transport drivers (auto rickshaws, passenger cars, and goods vehicles).
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
            2. Personal Data We Collect
          </h2>
          <p>We collect only the personal information necessary to deliver authentic, secure community rental, service, and transport connections:</p>
          <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
            <li><b>Account Identifiers:</b> Full name, verified Indian mobile phone number (+91), email address, user role, and encrypted password hash (bcrypt).</li>
            <li><b>Verification & Identity Documents:</b> For service providers, drivers, and property owners, we collect Government Identity (Aadhaar or Voter ID), Driving Licence details, and Vehicle Registration Certificates (RC). These documents are held strictly in private, access-controlled storage and are accessible only to authorized verification staff.</li>
            <li><b>Location Data:</b> With your explicit foreground GPS permission, we collect device coordinates to identify nearby available auto drivers, local trades, and rental properties. You may disable GPS access at any time in device settings.</li>
            <li><b>Communications & Bookings:</b> In-app chat messages, enquiry messages, trip logs, and service status updates.</li>
            <li><b>Technical & Device Telemetry:</b> IP address, browser type, device model, operating system version, and essential authentication session tokens.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
            3. Purpose of Processing & Legal Basis
          </h2>
          <p>Your personal data is processed lawfully and transparently for the following specific purposes:</p>
          <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
            <li>Authenticating user sessions and validating phone ownership via single-use mobile OTPs.</li>
            <li>Dispatching customer transport requests to nearby approved drivers.</li>
            <li>Revealing mutual contact details only after a service provider or driver accepts a booking.</li>
            <li>Conducting administrative identity checks to prevent fraud, unlicensed transport, or impersonation.</li>
            <li>Maintaining regulatory compliance and audit trails as required by Indian law.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
            4. Privacy by Design: Controlled Contact Disclosure
          </h2>
          <p>
            To protect your privacy against unsolicited marketing or harassment, <b>phone numbers and personal contact information are masked by default</b>. Contact details are revealed to the counterpart only when:
          </p>
          <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
            <li>A service provider explicitly accepts a customer's service request.</li>
            <li>An auto or car driver accepts a customer's ride booking.</li>
            <li>A property owner responds to an authenticated rental enquiry.</li>
          </ul>
          <p>
            Private verification documents (such as Driving Licences and Aadhaar copies) are <b>never exposed publicly</b> or shared with other platform users.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
            5. Direct Payments & Financial Privacy
          </h2>
          <p>
            <b>NUK RentServe is a 0% platform fee community network.</b> We do not collect, process, or store credit card numbers, debit card details, bank account credentials, or UPI PINs. All fares, rents, and service fees are settled directly between users, providers, and drivers (in cash or direct peer-to-peer UPI).
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
            6. Your Rights Under DPDP Act, 2023
          </h2>
          <p>As a Data Principal under Indian law, you possess enforceable rights:</p>
          <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
            <li><b>Right to Access & Information:</b> You have the right to obtain a summary of personal data processed by NUK RentServe.</li>
            <li><b>Right to Correction & Updating:</b> You can update your profile details and documents at any time from your account dashboard.</li>
            <li><b>Right to Erasure & Deletion:</b> You may request complete account deactivation and personal data deletion via our <Link to="/delete-account" style={{ color: 'var(--red)', fontWeight: '700' }}>Data Deletion Portal</Link> or in Settings. Upon confirmation, PII is permanently anonymized or purged, except where statutory retention rules apply.</li>
            <li><b>Right to Grievance Redressal:</b> You may lodge a complaint with our designated Grievance Officer.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
            7. Data Security & Storage
          </h2>
          <p>
            All network communications are secured using industry-standard Transport Layer Security (TLS 1.3 / HTTPS). Passwords are cryptographically hashed using bcrypt with salt rounds of 12. Verification sessions and authentication tokens are short-lived, digitally signed, and stored securely.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
            8. Grievance Officer & Contact Information
          </h2>
          <p>
            In accordance with the Digital Personal Data Protection Act, 2023 and the Information Technology Rules, the contact details of the Grievance Officer are:
          </p>
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '10px' }}>
            <p style={{ margin: '0 0 6px 0' }}><b>Name:</b> Grievance Redressal Officer</p>
            <p style={{ margin: '0 0 6px 0' }}><b>Organization:</b> NUK RentServe Operations</p>
            <p style={{ margin: '0 0 6px 0' }}><b>Address:</b> Navanagar / Sector 10, Bagalkot, Karnataka – 587102, India</p>
            <p style={{ margin: '0 0 6px 0' }}><b>Email:</b> <a href="mailto:grievance@nukrentserve.com" style={{ color: 'var(--red)', fontWeight: '700' }}>grievance@nukrentserve.com</a></p>
            <p style={{ margin: '0' }}><b>Response Timeline:</b> Acknowledgement within 48 hours; resolution within 30 days.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
