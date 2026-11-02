import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, readUser, saveSession } from '../services/api';

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
  const [form, setForm] = useState({ identifier: '', password: '' });
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

  async function submit(e) {
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
    <AuthShell title="Customer Sign In" subtitle="Sign in to explore rentals, local services and transport.">
      <form onSubmit={submit} className="form-stack">
        <label>
          Email or Mobile Number
          <input
            autoComplete="username"
            required
            placeholder="e.g. name@example.com or 9876543210"
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
      if (user.role !== 'provider' && user.role !== 'admin') {
        throw new Error('This account is registered as ' + user.role + '. Please use the correct login portal.');
      }
      nav('/provider/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
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
        {error && <div className="notice error" role="alert">{error}</div>}
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

// 6. Forgot Password
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
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
      <div className="auth-panel" style={{ maxWidth: '480px', margin: '40px auto' }}>
        <span className="eyebrow">RECOVERY</span>
        <h1>Reset your password</h1>
        <p className="muted">Enter your registered email address to receive password reset instructions.</p>
        <form className="form-stack" onSubmit={submit}>
          <label>
            Email Address
            <input
              type="email"
              required
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <div className="notice error">{error}</div>}
          {message && <div className="notice success">{message}</div>}
          <button className="btn btn-full" disabled={busy}>
            {busy ? 'Sending request…' : 'Request Password Reset'}
          </button>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <Link to="/login">← Back to Customer Login</Link>
            <Link to="/provider/login">Provider Login →</Link>
          </div>
        </form>
      </div>
    </section>
  );
}

// Backward compatible Register export that points to customer registration or hub
export { RegisterHub as Register } from './Registration';
