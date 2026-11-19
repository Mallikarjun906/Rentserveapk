import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { readUser, clearSession } from '../services/api';

export default function DeleteAccount() {
  const user = readUser();
  const navigate = useNavigate();

  const [reason, setReason] = useState('No longer using the platform');
  const [phone, setPhone] = useState(user?.phone || '');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!confirmed) {
      setError('Please check the confirmation box to authorize data deletion.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (user) {
        // Authenticated user direct deletion
        const res = await fetch('/api/v1/users/me', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('nuk_token')}`,
          },
          body: JSON.stringify({ reason }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to process account deletion.');
        }
        clearSession();
        setSuccess(true);
      } else {
        // Non-authenticated deletion request submission
        const res = await fetch('/api/v1/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'Account Deletion Request',
            subject: `DPDP Data Deletion Request for +91 ${phone}`,
            message: `User requested complete data deletion under DPDP Act 2023. Phone: ${phone}. Reason: ${reason}`,
          }),
        });
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again or email grievance@nukrentserve.com.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="wrap page" style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px' }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--navy)', marginBottom: '8px' }}>
            Account & Data Deletion Processed
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>
            In accordance with the Digital Personal Data Protection Act, 2023, your personal profile data, active sessions, and verification records have been permanently anonymized and scheduled for complete erasure.
          </p>
          <div style={{ marginTop: '24px' }}>
            <Link to="/" className="btn btn-primary">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page" style={{ maxWidth: '640px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 800, padding: '4px 12px', borderRadius: '4px' }}>
          DATA PRIVACY RIGHTS
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--navy)', marginTop: '12px', marginBottom: '8px' }}>
          Delete Account & Personal Data
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Under the Digital Personal Data Protection Act (DPDP), 2023, you have the right to request erasure of your personal data.
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px', color: '#991B1B', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <form onSubmit={handleDelete}>
          {user ? (
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <p style={{ margin: '0 0 4px 0' }}><b>Signed in as:</b> {user.name} ({user.email})</p>
              <p style={{ margin: 0 }}><b>Role:</b> {user.role.toUpperCase()}</p>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Registered Indian Mobile Number (+91)
              </label>
              <input
                className="input"
                type="tel"
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={10}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Reason for Deletion (Optional)
            </label>
            <select
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', padding: '10px' }}
            >
              <option value="No longer using the platform">No longer using the platform</option>
              <option value="Privacy concerns">Privacy concerns</option>
              <option value="Moving away from Karnataka / service area">Moving away from Karnataka / service area</option>
              <option value="Created duplicate account">Created duplicate account</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#92400E', lineHeight: 1.5 }}>
            <b>Please note:</b> Deleting your account will immediately cancel active listings, revoke driver/provider dispatch, and permanently anonymize your name, phone, and profile photo.
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '24px' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: '3px' }}
            />
            <span>
              I understand that this action is permanent and request complete deletion of my personal data under DPDP Act 2023.
            </span>
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', backgroundColor: 'var(--red)', borderColor: 'var(--red)', padding: '14px', fontWeight: 800 }}
          >
            {loading ? 'Processing Deletion Request...' : 'Permanently Delete My Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
