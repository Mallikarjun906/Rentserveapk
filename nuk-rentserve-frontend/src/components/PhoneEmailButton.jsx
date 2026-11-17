import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

/**
 * Phone.Email Mobile Verification Component
 * UK RentServe / NUK RentServe
 *
 * Client ID: 15695407177920574360
 * Official Script: https://www.phone.email/sign_in_button_v1.js
 */
export default function PhoneEmailButton({
  clientId = '15695407177920574360',
  purpose = 'customer-registration',
  onSuccess,
  onError,
  verifiedPhone = '',
  buttonLabel = 'Verify Mobile with OTP',
  disabled = false
}) {
  const containerRef = useRef(null);
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [verified, setVerified] = useState(Boolean(verifiedPhone));
  const [currentPhone, setCurrentPhone] = useState(verifiedPhone);

  useEffect(() => {
    if (verifiedPhone) {
      setVerified(true);
      setCurrentPhone(verifiedPhone);
    }
  }, [verifiedPhone]);

  useEffect(() => {
    if (verified) return;

    let timer;

    // Define window.phoneEmailListener
    window.phoneEmailListener = async function (userObj) {
      if (!userObj || !userObj.user_json_url) {
        if (onError) onError('Verification data was not returned by provider.');
        return;
      }

      setVerifying(true);
      setStatusMessage('Validating mobile verification with server…');

      try {
        const result = await api('auth/phone-email/verify', {
          method: 'POST',
          body: {
            user_json_url: userObj.user_json_url,
            purpose
          }
        });

        const verifiedNumber =
          result.phoneNumber || result.normalizedPhoneNumber;
        setVerified(true);
        setCurrentPhone(verifiedNumber);
        setStatusMessage('Mobile number verified successfully.');

        if (onSuccess) {
          onSuccess({
            verificationToken: result.verificationToken,
            phoneCountryCode: result.phoneCountryCode || '+91',
            phoneNumber: result.phoneNumber,
            normalizedPhoneNumber: result.normalizedPhoneNumber
          });
        }
      } catch (err) {
        setStatusMessage('');
        if (onError) onError(err.message || 'Phone verification failed.');
      } finally {
        setVerifying(false);
      }
    };

    // Load official script if not already present
    const SCRIPT_ID = 'phone-email-signin-script';
    let script = document.getElementById(SCRIPT_ID);

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://www.phone.email/sign_in_button_v1.js';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.phoneEmailInit) {
      // Re-initialize if SDK provides it
      try {
        window.phoneEmailInit();
      } catch {}
    }

    return () => {
      // Keep listener available while mounted
    };
  }, [verified, purpose, onSuccess, onError]);

  function handleReset() {
    setVerified(false);
    setCurrentPhone('');
    setStatusMessage('');
    if (onSuccess) {
      onSuccess({
        verificationToken: null,
        phoneCountryCode: '+91',
        phoneNumber: '',
        normalizedPhoneNumber: ''
      });
    }
  }

  if (verified && currentPhone) {
    return (
      <div
        className="phone-email-verified-box"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#f0fdf4',
          border: '1.5px solid #22c55e',
          borderRadius: '10px',
          marginBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#22c55e',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 'bold'
            }}
          >
            ✓
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#166534' }}>
              Mobile Number Verified
            </div>
            <div style={{ fontSize: '13px', color: '#15803d' }}>
              +91 {currentPhone}
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
    <div
      className="phone-email-button-wrapper"
      style={{ marginBottom: '16px' }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <label
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text, #111)'
          }}
        >
          Mobile Verification (Phone.Email OTP){' '}
          <span style={{ color: 'var(--red, #c51d37)' }}>*</span>
        </label>

        <div
          ref={containerRef}
          style={{
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {/* Official Phone.Email Button Element */}
          <div
            className="pe_signin_button"
            data-client-id={clientId}
            style={{ display: verifying ? 'none' : 'block' }}
          ></div>

          {verifying && (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--muted, #666)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ccc',
                  borderTopColor: 'var(--red, #c51d37)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <span>Validating OTP with Phone.Email…</span>
            </div>
          )}
        </div>

        {statusMessage && (
          <p
            style={{
              fontSize: '12px',
              color: '#15803d',
              margin: '2px 0 0'
            }}
          >
            {statusMessage}
          </p>
        )}

        <p
          style={{
            fontSize: '11px',
            color: 'var(--muted, #777)',
            margin: '2px 0 0'
          }}
        >
          Click the verification button to receive a secure OTP via Phone.Email.
        </p>
      </div>
    </div>
  );
}
