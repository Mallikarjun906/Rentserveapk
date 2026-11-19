import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="wrap page" style={{ maxWidth: '920px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="badge" style={{ backgroundColor: 'var(--blue-light)', color: 'var(--navy)', fontWeight: 800, padding: '4px 12px', borderRadius: '4px' }}>
          USER AGREEMENT
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--navy)', marginTop: '12px', marginBottom: '8px' }}>
          Terms & Conditions of Service
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Version: v2.1 · Effective Date: 1 May 2025 · Applicable to Customers, Providers, Drivers, Owners & Students
        </p>
      </div>

      <div className="card" style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)', lineHeight: '1.7', fontSize: '15px', color: '#334155' }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            1. Platform Nature & Relationship
          </h2>
          <p>
            <b>NUK RentServe</b> is an online technology intermediary and community platform operating in Karnataka, India. We connect customers seeking residential properties, commercial rentals, local maintenance services, and local transportation with independent third-party property owners, student listing partners, trade service providers, and motor vehicle drivers.
          </p>
          <p>
            NUK RentServe does not own, lease, manage, or operate rental properties, nor do we employ service providers or drivers. All services, rentals, and rides are performed by independent parties acting on their own behalf.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            2. Mandatory Mobile Verification & Account Security
          </h2>
          <p>
            To maintain safety and accountability across our community network:
          </p>
          <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
            <li>Every customer, service provider, and driver must verify a valid Indian mobile number (+91) via a one-time password (OTP) during registration.</li>
            <li>Users are strictly prohibited from creating fictitious accounts, impersonating others, or sharing authentication sessions.</li>
            <li>You are responsible for maintaining the confidentiality of your credentials. Notify us immediately if you suspect unauthorized access to your account.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            3. Role-Specific Rights and Obligations
          </h2>

          <div style={{ marginTop: '14px', marginBottom: '14px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid var(--red)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px 0' }}>A. Customers</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Customers agree to provide accurate pickup points, addresses, and travel details. Fares and agreed service charges must be paid directly to the driver or service provider upon satisfactory completion of the journey or trade work.
            </p>
          </div>

          <div style={{ marginBottom: '14px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #059669' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px 0' }}>B. Service Providers (Trades & Technicians)</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Service providers operate as independent professionals. Providers must submit genuine Government ID for verification, quote transparent estimates, disclose any parts or material costs prior to commencing work, and perform trades with reasonable skill, diligence, and safety.
            </p>
          </div>

          <div style={{ marginBottom: '14px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #D97706' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px 0' }}>C. Auto, Car & Goods Transport Drivers</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Drivers must hold a valid Indian Driving Licence (with applicable transport badge where legally required) and valid Vehicle Registration (RC), permit, fitness certificate, and motor third-party insurance. Drivers must drive sober, obey traffic laws, and adhere to agreed rates.
            </p>
          </div>

          <div style={{ marginBottom: '14px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid #4F46E5' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px 0' }}>D. Property Owners & Student Rental Partners</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Only owners or students with documented owner authorization may list properties. Rent, advance deposit, amenities, and photographs must reflect true conditions. Student partners agree that any commission is strictly an independent, consensual arrangement between owner and student; NUK RentServe does not assess, fix, or collect commissions.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            4. 0% Platform Fee & Direct Peer-to-Peer Payments
          </h2>
          <p>
            NUK RentServe is dedicated to community empowerment. <b>We do not deduct commission from drivers or service providers, nor do we add platform surcharges on customer bookings.</b> All payments are made directly between the customer and the provider/driver in cash or direct UPI.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            5. Content Moderation & Account Suspension
          </h2>
          <p>
            NUK RentServe reserves the right to review, reject, or remove any listing, profile, or application that violates legal requirements, exhibits fraudulent behavior, contains misleading photos, or endangers user safety. Violations may result in immediate suspension and, where required by law, referral to law enforcement.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            6. Governing Law & Dispute Jurisdiction
          </h2>
          <p>
            These Terms and any contractual disputes shall be governed by and construed in accordance with the laws of India. Any legal proceedings arising out of or related to the platform shall be subject to the exclusive jurisdiction of the competent courts in <b>Bagalkot, Karnataka, India</b>.
          </p>
        </section>
      </div>
    </div>
  );
}
