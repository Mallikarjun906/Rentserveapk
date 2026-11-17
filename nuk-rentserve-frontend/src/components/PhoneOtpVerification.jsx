import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

/**
 * Modern Phone OTP Verification Component
 * NUK RentServe
 */
export default function PhoneOtpVerification({
  purpose = 'customer-registration',
  role = 'customer',
  onVerified,
  onError,
  initialPhone = '',
  buttonLabel = 'Send OTP'
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifiedNumber, setVerifiedNumber] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async (isResend = false) => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      const err = 'Please enter a valid 10-digit Indian mobile number.';
      setErrorMsg(err);
      if (onError) onError(err);
      return;
    }

    setSending(true);
    setErrorMsg('');
    try {
      const res = await api('auth/phone/send-otp', {
        method: 'POST',
        body: { phone: cleanPhone, purpose, role }
      });

      setOtpSent(true);
      setCountdown(res?.resendAfterSeconds || 60);
      if (res?.devOtp) {
        setDevOtpHint(res.devOtp);
      }
    } catch (err) {
      const msg = err.message || 'Failed to send OTP.';
      setErrorMsg(msg);
      if (onError) onError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      const err = 'Please enter the 6-digit OTP code.';
      setErrorMsg(err);
      if (onError) onError(err);
      return;
    }

    setVerifying(true);
    setErrorMsg('');
    try {
      const res = await api('auth/phone/verify-otp', {
        method: 'POST',
        body: { phone: cleanPhone, otp: cleanOtp, purpose }
      });

      setVerified(true);
      setVerifiedNumber(cleanPhone);
      if (onVerified) {
        onVerified({
          verificationToken: res.verificationToken,
          phone: cleanPhone,
          phoneCountryCode: '+91'
        });
      }
    } catch (err) {
      const msg = err.message || 'Incorrect OTP code. Please try again.';
      setErrorMsg(msg);
      if (onError) onError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setVerified(false);
    setVerifiedNumber('');
    setOtpSent(false);
    setOtp('');
    setDevOtpHint('');
    setErrorMsg('');
    if (onVerified) {
      onVerified({ verificationToken: null, phone: '' });
    }
  };

  if (verified && verifiedNumber) {
    return (
      <div
        className="phone-otp-verified-badge"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#f0fdf4',
          border: '1.5px solid #22c55e',
          borderRadius: '10px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#22c55e',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ✓
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#166534' }}>
              Mobile Number Verified
            </div>
            <div style={{ fontSize: '13px', color: '#15803d' }}>
              +91 {verifiedNumber}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            color: '#dc2626',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 8px',
            textDecoration: 'underline'
          }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="phone-otp-component" style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
        Mobile Number (Indian +91) <span style={{ color: 'var(--red, #c51d37)' }}>*</span>
      </label>

      {/* Phone Input Row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            background: 'var(--canvas-subtle, #f5f5f5)',
            border: '1px solid var(--line, #ddd)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text, #111)'
          }}
        >
          🇮🇳 +91
        </div>
        <input
          type="tel"
          disabled={otpSent}
          placeholder="e.g. 9876543210"
          value={phone}
          maxLength={10}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
            setPhone(clean);
            setErrorMsg('');
          }}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line, #ddd)', fontSize: '14px' }}
        />
        {!otpSent && (
          <button
            type="button"
            className="btn"
            disabled={sending || phone.length < 10}
            onClick={() => handleSendOtp(false)}
            style={{ whiteSpace: 'nowrap', padding: '10px 16px', fontSize: '13px' }}
          >
            {sending ? 'Sending…' : buttonLabel}
          </button>
        )}
      </div>

      {/* OTP Code Entry Row */}
      {otpSent && (
        <div
          style={{
            padding: '14px',
            background: 'var(--canvas-subtle, #f8fafc)',
            border: '1px solid var(--line, #e2e8f0)',
            borderRadius: '10px',
            marginTop: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted, #64748b)' }}>
              Enter 6-digit OTP sent to <b>+91 {phone}</b>
            </span>
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(''); setDevOtpHint(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--muted, #64748b)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Edit number
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line, #ddd)',
                fontSize: '18px',
                letterSpacing: '3px',
                fontWeight: 700,
                textAlign: 'center'
              }}
            />
            <button
              type="button"
              className="btn"
              disabled={verifying || otp.length < 4}
              onClick={handleVerifyOtp}
              style={{ whiteSpace: 'nowrap', padding: '10px 18px', fontSize: '13px' }}
            >
              {verifying ? 'Verifying…' : 'Verify OTP'}
            </button>
          </div>

          {/* Resend Cooldown & devOtp hint */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px' }}>
            {countdown > 0 ? (
              <span style={{ color: 'var(--muted, #64748b)' }}>
                Resend OTP in <b>{countdown}s</b>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp(true)}
                disabled={sending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--red, #c51d37)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {sending ? 'Sending…' : 'Resend OTP'}
              </button>
            )}

            {devOtpHint && (
              <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Code: {devOtpHint}
              </span>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="notice error" style={{ marginTop: '8px', fontSize: '12px', padding: '8px 12px' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
