import React from 'react';
import { Link } from 'react-router-dom';

export default function RefundPolicy() {
  return (
    <div className="wrap page" style={{ maxWidth: '920px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 800, padding: '4px 12px', borderRadius: '4px' }}>
          TRANSPARENCY POLICY
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--navy)', marginTop: '12px', marginBottom: '8px' }}>
          Refund & Cancellation Policy
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Effective Date: 1 May 2025 · Last Updated: 17 November 2026
        </p>
      </div>

      <div className="card" style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)', lineHeight: '1.7', fontSize: '15px', color: '#334155' }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            1. Core Principle: Direct Payment Model
          </h2>
          <div style={{ backgroundColor: '#EFF6FF', borderLeft: '4px solid #2563EB', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1E40AF' }}>
              Important Note on Platform Payments:
            </p>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#1E3A8A' }}>
              NUK RentServe is a 0% commission matching platform. <b>NUK RentServe does NOT collect, escrow, or hold customer payments, rental deposits, or trip fares.</b> Fares and fees are paid directly by the customer to the independent driver or service professional in cash or direct UPI upon completion of the service.
            </p>
          </div>
          <p>
            Because NUK RentServe does not process intermediate payments, <b>there are no platform transaction fees, deduction charges, or gateway cancellation penalties</b> charged by NUK RentServe.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            2. Auto, Car & Transport Ride Cancellations
          </h2>
          <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
            <li><b>Customer Cancellation Before Driver Arrival:</b> Customers may cancel an auto or car request at any time prior to driver arrival through the in-app "Cancel Ride" button with zero cancellation fee.</li>
            <li><b>Driver Cancellation:</b> If a driver is delayed or unable to complete the trip, the customer may cancel and request another nearby driver immediately.</li>
            <li><b>Trip Completion:</b> Once a ride has been completed and the passenger has safely reached the destination, the agreed fare is payable directly to the driver and is non-refundable.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '10px' }}>
            3. Home Services & Trade Professional Bookings
          </h2>
          <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
            <li><b>Cancellation Prior to Service:</b> Customers can cancel a pending or accepted service booking free of charge before the service professional begins physical work or purchases requested custom materials.</li>
            <li><b>Estimates & Material Costs:</b> Always agree on repair estimates and material receipts before the provider commences work. Service charges paid directly to providers are non-refundable once the work has been inspected and approved by the customer.</li>
            <li><b>Disputed Workmanship:</b> If a service provider fails to complete the agreed work or delivers substandard workmanship, report the booking within 48 hours via our Support Help Desk. We will mediate between the parties and assist in resolution.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            4. Rental Property Deposits & Rents
          </h2>
          <p>
            Security deposits and monthly rents are negotiated and exchanged directly between the tenant and the property owner. <b>Never transfer advance money to individuals you have not physically met or for properties you have not inspected.</b>
          </p>
          <p>
            Always execute a written rental agreement and obtain a signed physical or digital receipt for any deposit paid directly to an owner.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            5. Contact Support for Dispute Assistance
          </h2>
          <p>
            If you encounter payment discrepancies, overcharging, or unfair refusal of agreed terms, contact our support desk immediately:
          </p>
          <p style={{ marginTop: '8px' }}>
            <b>Email:</b> <a href="mailto:support@nukrentserve.com" style={{ color: 'var(--red)', fontWeight: 700 }}>support@nukrentserve.com</a><br />
            <b>Help Desk:</b> <Link to="/contact" style={{ color: 'var(--red)', fontWeight: 700 }}>Online Support Portal</Link><br />
            <b>Location:</b> Navanagar / Sector 10, Bagalkot, Karnataka – 587102
          </p>
        </section>
      </div>
    </div>
  );
}
