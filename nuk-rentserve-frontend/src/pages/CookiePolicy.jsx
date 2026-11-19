import React from 'react';
import { Link } from 'react-router-dom';

export default function CookiePolicy() {
  return (
    <div className="wrap page" style={{ maxWidth: '920px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#065F46', fontWeight: 800, padding: '4px 12px', borderRadius: '4px' }}>
          COOKIE & STORAGE POLICY
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--navy)', marginTop: '12px', marginBottom: '8px' }}>
          Cookie & Local Storage Policy
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Effective Date: 1 May 2025 · Last Updated: 17 November 2026
        </p>
      </div>

      <div className="card" style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)', lineHeight: '1.7', fontSize: '15px', color: '#334155' }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            1. What Are Cookies and Local Storage?
          </h2>
          <p>
            Cookies and browser local storage technologies are small text files and key-value records saved in your browser or device when you access <b>NUK RentServe</b>. They enable the web platform to remember your active sign-in session, user preferences, and language selection.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            2. Real Technologies Used on NUK RentServe
          </h2>
          <p>
            In accordance with our strict data minimization principles, <b>we do not sell user data, nor do we employ intrusive cross-site advertising networks</b>. We only utilize the following categories:
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', marginBottom: '14px', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', textAlign: 'left', borderBottom: '2px solid #CBD5E1' }}>
                <th style={{ padding: '10px' }}>Identifier / Key</th>
                <th style={{ padding: '10px' }}>Category</th>
                <th style={{ padding: '10px' }}>Purpose & Expiry</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px' }}><code>nuk_token</code></td>
                <td style={{ padding: '10px' }}>Strictly Essential</td>
                <td style={{ padding: '10px' }}>Stores your secure JWT session token to authenticate requests. Retained for active session duration.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px' }}><code>nuk_user</code></td>
                <td style={{ padding: '10px' }}>Strictly Essential</td>
                <td style={{ padding: '10px' }}>Stores your basic profile info (name, role, city) to render the navigation header and dashboard.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px' }}><code>nuk_cookie_consent</code></td>
                <td style={{ padding: '10px' }}>Preferences</td>
                <td style={{ padding: '10px' }}>Remembers your cookie banner preferences so you are not prompted on every page refresh. Retained for 1 year.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '10px' }}><code>OpenStreetMap Tiles</code></td>
                <td style={{ padding: '10px' }}>Functional</td>
                <td style={{ padding: '10px' }}>Caches map tiles and route markers locally in your browser cache to reduce bandwidth usage when browsing rentals.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--navy)', marginBottom: '10px' }}>
            3. Managing Your Preferences
          </h2>
          <p>
            You can change your cookie preferences at any time using our on-page cookie settings or by clearing your browser's application storage. Disabling strictly essential tokens will require you to re-authenticate each time you visit.
          </p>
          <div style={{ marginTop: '16px' }}>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                localStorage.removeItem('nuk_cookie_consent');
                window.location.reload();
              }}
            >
              Reset Cookie Consent Settings
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
