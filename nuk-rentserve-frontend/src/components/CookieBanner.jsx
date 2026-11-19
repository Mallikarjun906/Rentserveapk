import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [functionalConsent, setFunctionalConsent] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('nuk_cookie_consent');
    if (!saved) {
      setVisible(true);
    }
  }, []);

  const saveConsent = (choice) => {
    localStorage.setItem(
      'nuk_cookie_consent',
      JSON.stringify({
        choice,
        timestamp: new Date().toISOString(),
        essential: true,
        functional: choice === 'all' || (choice === 'custom' && functionalConsent),
      })
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        padding: '20px 24px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.25)',
        zIndex: 9999,
        borderTop: '2px solid #334155',
      }}
    >
      <div
        className="wrap"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>🍪</span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                Your Privacy Choices · NUK RentServe
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8', lineHeight: 1.6 }}>
              We use strictly essential local storage tokens to keep you securely signed in and cache local map tiles for rental properties. We do not use third-party advertising cookies or sell your personal information. Read our{' '}
              <Link to="/cookies" style={{ color: '#38BDF8', textDecoration: 'underline' }}>
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link to="/privacy" style={{ color: '#38BDF8', textDecoration: 'underline' }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-small"
              onClick={() => setPreferencesOpen(!preferencesOpen)}
              style={{
                backgroundColor: 'transparent',
                borderColor: '#64748B',
                color: '#E2E8F0',
                padding: '8px 14px',
                fontSize: '13px',
              }}
            >
              {preferencesOpen ? 'Close Options' : 'Preferences'}
            </button>
            <button
              type="button"
              className="btn btn-small"
              onClick={() => saveConsent('essential')}
              style={{
                backgroundColor: '#334155',
                borderColor: '#475569',
                color: '#fff',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              Reject Non-Essential
            </button>
            <button
              type="button"
              className="btn btn-small btn-primary"
              onClick={() => saveConsent('all')}
              style={{
                backgroundColor: 'var(--red)',
                borderColor: 'var(--red)',
                color: '#fff',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 800,
              }}
            >
              Accept All
            </button>
          </div>
        </div>

        {preferencesOpen && (
          <div
            style={{
              backgroundColor: '#1E293B',
              padding: '16px',
              borderRadius: '8px',
              marginTop: '8px',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ fontSize: '13px', color: '#fff' }}>Strictly Essential Tokens (JWT & User Session)</b>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  Required for user login, role routing, and mobile OTP authentication. Cannot be disabled.
                </p>
              </div>
              <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 800 }}>Always Active</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ fontSize: '13px', color: '#fff' }}>Functional Map Caching (OpenStreetMap Tiles)</b>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>
                  Caches map tiles locally to save mobile data when viewing driver tracking or rentals.
                </p>
              </div>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  checked={functionalConsent}
                  onChange={(e) => setFunctionalConsent(e.target.checked)}
                />
                <span style={{ fontSize: '12px', color: '#E2E8F0' }}>Enable</span>
              </label>
            </div>

            <div style={{ alignSelf: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => saveConsent('custom')}
                style={{
                  backgroundColor: 'var(--blue)',
                  borderColor: 'var(--blue)',
                  color: '#fff',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                Save My Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
