import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, readUser, saveSession } from '../services/api';
import PhoneEmailButton from '../components/PhoneEmailButton.jsx';
import PhoneOtpVerification from '../components/PhoneOtpVerification.jsx';

// Shared Password Input with Visibility Toggle Eye
export function PasswordInput({ value, onChange, placeholder = 'Enter password', required = true, id, name = 'password', minLength = 8, maxLength = 72, autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        type={show ? 'text' : 'password'}
        id={id}
        name={name}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%', paddingRight: '46px' }}
      />
      <button
        type="button"
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute',
          right: '10px',
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '6px 8px'
        }}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

// Shell layout for authentication cards
export function AuthShell({ title, subtitle, badge = 'YOUR ACCOUNT', children, asideTitle = 'Find what you need.', asideSubtitle = 'Connect locally.' }) {
  return (
    <section className="auth-wrap">
      <div className="auth-aside">
        <div className="auth-aside-inner">
          <span className="pill">NUK RENTSERVE</span>
          <h2>{asideTitle}<br/><em>{asideSubtitle}</em></h2>
          <p>Properties, services and transport — designed around communities across Karnataka.</p>
        </div>
      </div>
      <div className="auth-panel">
        <span className="eyebrow">{badge}</span>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

// Google Sign-In for Customers Only
export function GoogleSignIn({ onSuccess, onError, busy }) {
  const host = useRef(null);
  const [status, setStatus] = useState('');
  const [configured, setConfigured] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setConfigured(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    let timer;

    const init = () => {
      if (cancelled) return;
      if (window.google?.accounts?.id && host.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              try {
                onError('');
                const data = await api('auth/google', {
                  method: 'POST',
                  body: { credential: response.credential }
                });
                await onSuccess(data);
              } catch (err) {
                onError(err.message);
              }
            },
            auto_select: false
          });
          host.current.innerHTML = '';
          window.google.accounts.id.renderButton(host.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            shape: 'rectangular',
            text: 'continue_with',
            width: Math.min(380, host.current.clientWidth || 340),
            logo_alignment: 'left'
          });
          setConfigured(true);
          setStatus('');
        } catch {
          setConfigured(false);
          setStatus('Google Sign-In could not initialize.');
        }
        return;
      }
      attempts++;
      if (attempts < 30) timer = setTimeout(init, 200);
      else {
        setConfigured(false);
        setStatus('Google Sign-In script failed to load.');
      }
    };

    if (!document.querySelector('script[data-google-identity]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.onload = init;
      script.onerror = () => {
        setConfigured(false);
        setStatus('Unable to load Google Sign-In script.');
      };
      document.head.appendChild(script);
    } else {
      init();
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [clientId, onSuccess, onError]);

  return (
    <div className="google-signin-wrap">
      {!configured && (
        <button
          type="button"
          className="google-fallback-btn"
          disabled={busy}
          onClick={() =>
            setStatus(
              clientId
                ? 'Google Sign-In is initializing. Please wait a moment...'
                : 'Google Sign-In is not configured. Please use email and password, or set VITE_GOOGLE_CLIENT_ID.'
            )
          }
        >
          <span className="google-g-mark" aria-hidden="true">G</span>
          <span>Continue with Google</span>
        </button>
      )}
      <div ref={host} className="google-signin-host" aria-label="Continue with Google" />
      {status && <p className="google-setup-note" role="status" style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>{status}</p>}
      {busy && <p className="muted tiny">Signing in…</p>}
    </div>
  );
}

// 1. Customer Login (/login)
export function Login() {
  const [mode, setMode] = useState('otp'); // 'otp' or 'password'
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const finish = useCallback(
    async (data) => {
      const user = saveSession(data);
      if (user.role === 'admin') nav('/admin', { replace: true });
      else if (user.role === 'provider') nav('/provider/dashboard', { replace: true });
      else if (user.role === 'driver') nav('/driver/dashboard', { replace: true });
      else if (user.role === 'student') nav('/student/dashboard', { replace: true });
      else nav(loc.state?.from || '/dashboard', { replace: true });
    },
    [nav, loc.state]
  );

  // Timer for OTP resend countdown
  useEffect(() => {
    let t;
    if (countdown > 0) {
      t = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [countdown]);

  // Method 1: Send OTP
  async function handleSendOtp() {
    const cleanPhone = otpPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await api('auth/phone/send-otp', {
        method: 'POST',
        body: { phone: cleanPhone, purpose: 'customer-login', role: 'customer' }
      });
      setOtpSent(true);
      setCountdown(res?.resendAfterSeconds || 60);
      if (res?.devOtp) setDevOtpHint(res.devOtp);
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setBusy(false);
    }
  }

  // Method 1: Verify & Login with OTP
  async function handleVerifyAndLogin(e) {
    if (e) e.preventDefault();
    const cleanPhone = otpPhone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const data = await api('auth/phone/login-with-otp', {
        method: 'POST',
        body: { phone: cleanPhone, otp: cleanOtp, role: 'customer' }
      });
      await finish(data);
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setBusy(false);
    }
  }

  // Method 2: Login with Password
  async function submitPassword(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('auth/login', {
        method: 'POST',
        body: { email: form.identifier.trim(), password: form.password }
      });
      await finish(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Customer Sign In" subtitle="Sign in to explore verified rentals, local services and transport.">
      {/* Modern Two-Tab Selector */}
      <div
        className="login-tabs"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '22px',
          background: 'var(--canvas-subtle, #f1f3f5)',
          padding: '4px',
          borderRadius: '10px'
        }}
      >
        <button
          type="button"
          onClick={() => { setMode('otp'); setError(''); }}
          style={{
            padding: '11px 14px',
            border: 'none',
            borderRadius: '8px',
            background: mode === 'otp' ? '#fff' : 'transparent',
            fontWeight: mode === 'otp' ? 700 : 500,
            color: mode === 'otp' ? 'var(--text, #111)' : 'var(--muted, #666)',
            boxShadow: mode === 'otp' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          📱 Login with OTP
        </button>
        <button
          type="button"
          onClick={() => { setMode('password'); setError(''); }}
          style={{
            padding: '11px 14px',
            border: 'none',
            borderRadius: '8px',
            background: mode === 'password' ? '#fff' : 'transparent',
            fontWeight: mode === 'password' ? 700 : 500,
            color: mode === 'password' ? 'var(--text, #111)' : 'var(--muted, #666)',
            boxShadow: mode === 'password' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          🔑 Login with Password
        </button>
      </div>

      {/* TAB 1: LOGIN WITH OTP */}
      {mode === 'otp' && (
        <div className="otp-login-card">
          <form onSubmit={otpSent ? handleVerifyAndLogin : (e) => { e.preventDefault(); handleSendOtp(); }} className="form-stack">
            <label>
              Indian Mobile Number
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    background: 'var(--canvas-subtle, #f5f5f5)',
                    border: '1px solid var(--line, #ddd)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  disabled={otpSent || busy}
                  placeholder="e.g. 9876543210"
                  value={otpPhone}
                  maxLength={10}
                  onChange={(e) => {
                    setOtpPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setError('');
                  }}
                  style={{ flex: 1 }}
                />
              </div>
            </label>

            {!otpSent ? (
              <button
                type="button"
                className="btn btn-full"
                disabled={busy || otpPhone.length < 10}
                onClick={handleSendOtp}
              >
                {busy ? 'Sending OTP…' : 'Send OTP'}
              </button>
            ) : (
              <div
                style={{
                  background: 'var(--canvas-subtle, #f8fafc)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--line, #e2e8f0)',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--muted, #64748b)' }}>
                    OTP sent to <b>+91 {otpPhone}</b>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); setDevOtpHint(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted, #64748b)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change number
                  </button>
                </div>

                <label>
                  Enter 6-digit OTP Code
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{
                      fontSize: '20px',
                      letterSpacing: '4px',
                      fontWeight: 700,
                      textAlign: 'center',
                      padding: '10px 14px',
                      marginTop: '4px'
                    }}
                  />
                </label>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px' }}>
                  {countdown > 0 ? (
                    <span style={{ color: 'var(--muted, #64748b)' }}>
                      Resend in <b>{countdown}s</b>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={busy}
                      style={{ background: 'none', border: 'none', color: 'var(--red, #c51d37)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Resend OTP
                    </button>
                  )}

                  {devOtpHint && (
                    <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Code: {devOtpHint}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-full"
                  disabled={busy || otpCode.length < 4}
                  style={{ marginTop: '14px' }}
                >
                  {busy ? 'Verifying & Logging In…' : 'Verify & Sign In'}
                </button>
              </div>
            )}

            {error && <div className="notice error" role="alert">{error}</div>}

            <p className="form-note">
              New customer? <Link to="/register/customer"><b>Create customer account</b></Link>
            </p>
          </form>
        </div>
      )}

      {/* TAB 2: LOGIN WITH PASSWORD */}
      {mode === 'password' && (
        <form onSubmit={submitPassword} className="form-stack">
          <label>
            Mobile Number or Email
            <input
              autoComplete="username"
              required
              placeholder="e.g. 9876543210 or name@example.com"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            />
          </label>
          <label>
            Password
            <PasswordInput
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <div className="form-row">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          {error && <div className="notice error" role="alert">{error}</div>}
          <button className="btn btn-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in as Customer'}
          </button>
          <p className="form-note">
            New customer? <Link to="/register/customer"><b>Create customer account</b></Link>
          </p>
        </form>
      )}

      <div className="auth-divider"><span>OR CONTINUE WITH</span></div>
      <GoogleSignIn onSuccess={finish} onError={setError} busy={busy} />

      <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--line)', fontSize: '13px' }}>
        <p className="muted" style={{ marginBottom: '8px' }}><b>Looking for other role portals?</b></p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link to="/provider/login" style={{ color: 'var(--red)', fontWeight: 700 }}>Provider Login →</Link>
          <Link to="/driver/login" style={{ color: 'var(--red)', fontWeight: 700 }}>Driver Login →</Link>
          <Link to="/student/login" style={{ color: 'var(--red)', fontWeight: 700 }}>Student Login →</Link>
          <Link to="/admin/login" style={{ color: 'var(--muted)', fontWeight: 700 }}>Admin Portal →</Link>
        </div>
      </div>
    </AuthShell>
  );
}

// 2. Provider Login (/provider/login)
export function ProviderLogin() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusState, setStatusState] = useState(null); // 'pending' | 'rejected' | null
  const [rejectionReason, setRejectionReason] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setStatusState(null);
    setRejectionReason('');
    try {
      const data = await api('auth/provider/login', {
        method: 'POST',
        body: { identifier: form.identifier.trim(), password: form.password }
      });
      const user = saveSession(data);
      if (user.role !== 'provider' && user.role !== 'admin') {
        throw new Error('This account is registered as ' + user.role + '. Please use the correct login portal.');
      }
      nav('/provider/dashboard', { replace: true });
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('under review') ||
        msg.includes('admin approval') ||
        msg.includes('pending')
      ) {
        setStatusState('pending');
      } else if (msg.includes('rejected')) {
        setStatusState('rejected');
        setRejectionReason(msg);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Service Provider Login"
      subtitle="Access your provider dashboard, service bookings and client enquiries."
      badge="SERVICE PROVIDER PORTAL"
      asideTitle="Grow your trade."
      asideSubtitle="Direct with customers."
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Provider Email or Mobile
          <input
            autoComplete="username"
            required
            placeholder="e.g. provider@example.com"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          />
        </label>
        <label>
          Password
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <div className="form-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        {/* 1. Pending Approval Alert */}
        {statusState === 'pending' && (
          <div
            style={{
              padding: '16px',
              background: '#fffbeb',
              border: '1.5px solid #f59e0b',
              borderRadius: '10px',
              color: '#92400e',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>⏳</span>
              <strong style={{ fontSize: '14px' }}>Application Under Review</strong>
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
              Your registration is under review. Please wait for admin approval.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#b45309' }}>
              Our administration verifies all trade licenses, ID documents, and address proofs before activating provider accounts.
            </p>
          </div>
        )}

        {/* 2. Rejection Notice Alert */}
        {statusState === 'rejected' && (
          <div
            style={{
              padding: '16px',
              background: '#fef2f2',
              border: '1.5px solid #ef4444',
              borderRadius: '10px',
              color: '#991b1b',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>✕</span>
              <strong style={{ fontSize: '14px' }}>Registration Not Approved</strong>
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
              {rejectionReason || 'Your provider registration was rejected by administrator.'}
            </p>
            <div style={{ marginTop: '10px' }}>
              <Link to="/register/provider" style={{ color: '#b91c1c', fontWeight: 700, fontSize: '13px' }}>
                Resubmit trade documents & details →
              </Link>
            </div>
          </div>
        )}

        {error && !statusState && <div className="notice error" role="alert">{error}</div>}

        <button className="btn btn-full" disabled={busy}>
          {busy ? 'Verifying provider…' : 'Sign In to Provider Dashboard'}
        </button>
        <p className="form-note">
          Need to register your trade? <Link to="/register/provider"><b>Apply as Service Provider</b></Link>
        </p>
        <div style={{ marginTop: '16px', fontSize: '13px' }}>
          <Link to="/login" style={{ color: 'var(--muted)' }}>← Customer Sign In</Link>
        </div>
      </form>
    </AuthShell>
  );
}

// 3. Driver Login (/driver/login)
export function DriverLogin() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('auth/login', {
        method: 'POST',
        body: { email: form.identifier.trim(), password: form.password }
      });
      const user = saveSession(data);
      if (user.role !== 'driver' && user.role !== 'admin') {
        throw new Error('This account is registered as ' + user.role + '. Please use the driver login portal with driver credentials.');
      }
      nav('/driver/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Transport Driver Login"
      subtitle="Access trips, live GPS dispatch and auto/car transport requests."
      badge="TRANSPORT DRIVER PORTAL"
      asideTitle="Drive with NUK."
      asideSubtitle="Fair rides & zero commission."
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Driver Email or Mobile
          <input
            autoComplete="username"
            required
            placeholder="e.g. driver@example.com"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          />
        </label>
        <label>
          Password
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <div className="form-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        {error && <div className="notice error" role="alert">{error}</div>}
        <button className="btn btn-full" disabled={busy}>
          {busy ? 'Connecting to Driver Console…' : 'Sign In as Driver'}
        </button>
        <p className="form-note">
          Register auto, car or goods vehicle? <Link to="/register/driver"><b>Register as Driver</b></Link>
        </p>
        <div style={{ marginTop: '16px', fontSize: '13px' }}>
          <Link to="/login" style={{ color: 'var(--muted)' }}>← Customer Sign In</Link>
        </div>
      </form>
    </AuthShell>
  );
}

// 4. Student Login (/student/login)
export function StudentLogin() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('auth/login', {
        method: 'POST',
        body: { email: form.identifier.trim(), password: form.password }
      });
      const user = saveSession(data);
      if (user.role !== 'student' && user.role !== 'admin') {
        throw new Error('This account is registered as ' + user.role + '. Please sign in with your verified student account.');
      }
      nav('/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Student Partner Login"
      subtitle="Access authorized student rental listings and campus housing support."
      badge="STUDENT PARTNER PORTAL"
      asideTitle="Campus Rentals."
      asideSubtitle="By students, for students."
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Student Email or Mobile
          <input
            autoComplete="username"
            required
            placeholder="e.g. student@college.edu or 9876543210"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          />
        </label>
        <label>
          Password
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <div className="form-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        {error && <div className="notice error" role="alert">{error}</div>}
        <button className="btn btn-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In as Student'}
        </button>
        <p className="form-note">
          College student in Karnataka? <Link to="/register/student"><b>Register as Student</b></Link>
        </p>
        <div style={{ marginTop: '16px', fontSize: '13px' }}>
          <Link to="/login" style={{ color: 'var(--muted)' }}>← Customer Sign In</Link>
        </div>
      </form>
    </AuthShell>
  );
}

// 5. Admin Login (/admin/login)
export function AdminLogin() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('admin/login', {
        method: 'POST',
        body: { email: form.identifier.trim(), password: form.password }
      });
      const user = saveSession(data);
      if (user.role !== 'admin') {
        throw new Error('Access denied. Only system administrators can access this portal.');
      }
      nav('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Administrator Console"
      subtitle="Restricted security portal. Authorized administrators only."
      badge="RESTRICTED ACCESS · SYSTEM ADMINISTRATOR"
      asideTitle="System Integrity."
      asideSubtitle="Audit, verify & govern."
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Administrator Email
          <input
            autoComplete="username"
            type="email"
            required
            placeholder="e.g. admin@nukrentserve.com"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          />
        </label>
        <label>
          Administrator Password
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        {error && <div className="notice error" role="alert">{error}</div>}
        <button className="btn btn-full" disabled={busy} style={{ background: '#1c191a', borderColor: '#1c191a' }}>
          {busy ? 'Authenticating admin…' : 'Access Administrator Console'}
        </button>
        <p className="form-note" style={{ color: 'var(--muted)', fontSize: '12px' }}>
          Security notice: All administrative access attempts are recorded in system audit logs with timestamp and IP address.
        </p>
        <div style={{ marginTop: '16px', fontSize: '13px' }}>
          <Link to="/login" style={{ color: 'var(--muted)' }}>← Customer Sign In</Link>
        </div>
      </form>
    </AuthShell>
  );
}

// 6. Forgot Password (OTP Verification Required + Alternative Email Recovery)
export function ForgotPassword() {
  const [method, setMethod] = useState('otp'); // 'otp' or 'email'
  const [step, setStep] = useState('verify'); // 'verify' | 'reset' | 'success'
  const [resetToken, setResetToken] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  // 1. Phone.Email OTP Verification Handler
  async function handleOtpVerified({ verificationToken, phoneNumber }) {
    if (!verificationToken) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('auth/password/forgot', {
        method: 'POST',
        body: { verificationToken }
      });
      if (data?.resetToken) {
        setResetToken(data.resetToken);
        setVerifiedPhone(phoneNumber || '');
        setStep('reset');
        setMessage('Mobile number verified. Please set your new secure password.');
      } else {
        setMessage(
          data?.message ||
            'If an eligible account is registered with this verified mobile number, reset instructions have been prepared. (No active account matched this number).'
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // 2. Set New Password Handler
  async function handleResetSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwords.newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (passwords.newPassword.length > 72) {
      setError('Password must not exceed 72 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setBusy(true);
    try {
      await api('auth/password/reset', {
        method: 'POST',
        body: {
          resetToken,
          newPassword: passwords.newPassword,
          confirmPassword: passwords.confirmPassword
        }
      });
      setStep('success');
      setMessage('Your password has been reset successfully. Existing sessions have been revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // 3. Alternative Email Reset Handler (for legacy or email-only recovery)
  async function submitEmail(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const d = await api('auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() }
      });
      setMessage(d?.message || 'If an account exists, password reset instructions have been dispatched.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-simple">
      <div className="auth-panel" style={{ maxWidth: '500px', margin: '40px auto' }}>
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1>Reset your password</h1>
        <p className="muted">
          {step === 'reset'
            ? 'Enter and confirm your new secure password.'
            : step === 'success'
            ? 'Your account password has been updated.'
            : 'Verify your registered mobile number using Phone.Email OTP to securely set a new password.'}
        </p>

        {/* Method Switcher when in initial step */}
        {step === 'verify' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '20px',
              background: 'var(--canvas-subtle, #f1f3f5)',
              padding: '4px',
              borderRadius: '8px'
            }}
          >
            <button
              type="button"
              onClick={() => { setMethod('otp'); setError(''); setMessage(''); }}
              style={{
                padding: '9px 12px',
                border: 'none',
                borderRadius: '6px',
                background: method === 'otp' ? '#fff' : 'transparent',
                fontWeight: method === 'otp' ? 700 : 500,
                color: method === 'otp' ? 'var(--text)' : 'var(--muted)',
                boxShadow: method === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              📱 Mobile OTP (Fast)
            </button>
            <button
              type="button"
              onClick={() => { setMethod('email'); setError(''); setMessage(''); }}
              style={{
                padding: '9px 12px',
                border: 'none',
                borderRadius: '6px',
                background: method === 'email' ? '#fff' : 'transparent',
                fontWeight: method === 'email' ? 700 : 500,
                color: method === 'email' ? 'var(--text)' : 'var(--muted)',
                boxShadow: method === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              ✉️ Email Recovery
            </button>
          </div>
        )}

        {error && <div className="notice error" role="alert" style={{ marginBottom: '16px' }}>{error}</div>}
        {message && <div className="notice success" role="status" style={{ marginBottom: '16px' }}>{message}</div>}

        {/* STEP 1: Phone OTP Verification */}
        {method === 'otp' && step === 'verify' && (
          <div className="otp-reset-block">
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
              Click below to verify your registered mobile number via Phone.Email. Once verified, you will be authorized to choose a new password.
            </p>
            <PhoneEmailButton
              purpose="password-reset"
              onSuccess={handleOtpVerified}
              onError={setError}
              buttonLabel="Verify Mobile for Password Reset"
            />
            {busy && <p className="muted tiny" style={{ marginTop: '8px' }}>Validating reset authorization…</p>}
          </div>
        )}

        {/* STEP 2: Enter New Password */}
        {method === 'otp' && step === 'reset' && (
          <form className="form-stack" onSubmit={handleResetSubmit}>
            <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', fontSize: '13px', color: '#166534', marginBottom: '12px' }}>
              Verified Mobile: <b>+91 {verifiedPhone}</b>
            </div>
            <label>
              New Password (minimum 8 characters)
              <PasswordInput
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Enter new secure password"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm New Password
              <PasswordInput
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </label>
            <button className="btn btn-full" disabled={busy}>
              {busy ? 'Updating password…' : 'Set New Password'}
            </button>
          </form>
        )}

        {/* STEP 3: Password Reset Successful */}
        {method === 'otp' && step === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#22c55e',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '16px'
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Password Successfully Updated</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
              You can now sign in using your new password. All prior sessions have been securely terminated.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/login" className="btn btn-full">Sign In as Customer</Link>
              <Link to="/provider/login" className="btn btn-outline btn-full">Sign In as Provider</Link>
            </div>
          </div>
        )}

        {/* Legacy Email Reset Form */}
        {method === 'email' && step === 'verify' && (
          <form className="form-stack" onSubmit={submitEmail}>
            <label>
              Registered Email Address
              <input
                type="email"
                required
                placeholder="e.g. user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="btn btn-full" disabled={busy}>
              {busy ? 'Sending request…' : 'Request Password Reset'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <Link to="/login" style={{ color: 'var(--muted)' }}>← Customer Sign In</Link>
          <Link to="/provider/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Provider Sign In →</Link>
        </div>
      </div>
    </section>
  );
}

// Backward compatible Register export that points to customer registration or hub
export { RegisterHub as Register } from './Registration';
