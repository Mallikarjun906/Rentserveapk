import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveSession } from '../services/api';
import { AuthShell, GoogleSignIn, PasswordInput } from './Auth';

// Helper for file preview
function FileUploadPreview({ file, label, accept = 'image/*,application/pdf', required = false, onChange }) {
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result);
        reader.readAsDataURL(selected);
      } else {
        setPreview(null);
      }
      onChange(selected);
    } else {
      setPreview(null);
      onChange(null);
    }
  };

  return (
    <div className="file-upload-block" style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px' }}>
        {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
      </label>
      <input
        type="file"
        accept={accept}
        required={required}
        onChange={handleFile}
        style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '8px', background: '#fff' }}
      />
      {file && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {preview ? (
            <img src={preview} alt="Upload preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)' }} />
          ) : (
            <div style={{ padding: '6px 12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px' }}>
              📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
          <span style={{ fontSize: '12px', color: '#176a3a', fontWeight: 600 }}>✓ File selected</span>
        </div>
      )}
    </div>
  );
}

// 1. Role Selection Hub (/register)
export function RegisterHub() {
  const roles = [
    {
      title: 'Customer',
      kannada: 'ಗ್ರಾಹಕರು',
      desc: 'Browse verified rentals, book trusted home services, and request rides.',
      to: '/register/customer',
      icon: '🏠',
      badge: 'IMMEDIATE ACCESS'
    },
    {
      title: 'Service Provider',
      kannada: 'ಸೇವಾ ಪೂರೈಕೆದಾರರು',
      desc: 'List your trade (electrician, plumber, carpenter, cleaning) and connect directly with clients.',
      to: '/register/provider',
      icon: '🛠️',
      badge: 'TRADE ONBOARDING'
    },
    {
      title: 'Transport Driver',
      kannada: 'ಚಾಲಕರು',
      desc: 'Register Auto Rickshaw, Passenger Car, or Goods Van with 0% platform retention.',
      to: '/register/driver',
      icon: '🛺',
      badge: 'FLEET & DRIVER'
    },
    {
      title: 'Student Rental Partner',
      kannada: 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರರು',
      desc: 'Access verified college campus housing, student PGs and peer rental support.',
      to: '/register/student',
      icon: '🎓',
      badge: 'COLLEGE ID VERIFIED'
    }
  ];

  return (
    <section className="wrap section" style={{ maxWidth: '1000px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <span className="eyebrow">JOIN NUK RENTSERVE</span>
        <h1>Choose your account role</h1>
        <p className="muted" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '16px' }}>
          Select the account type that matches your needs. Each role provides a dedicated experience and permissions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {roles.map((r) => (
          <article
            key={r.title}
            className="dashboard-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--line)',
              background: '#fff',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>{r.icon}</span>
                <span className="eyebrow" style={{ fontSize: '10px' }}>{r.badge}</span>
              </div>
              <h2 style={{ fontSize: '22px', margin: '6px 0 4px' }}>{r.title}</h2>
              <small style={{ color: 'var(--red)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                {r.kannada}
              </small>
              <p className="muted" style={{ fontSize: '14px', lineHeight: 1.6 }}>{r.desc}</p>
            </div>
            <div style={{ marginTop: '20px' }}>
              <Link to={r.to} className="btn btn-full">
                Register as {r.title} →
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '36px', fontSize: '14px' }}>
        Already registered? <Link to="/login" style={{ color: 'var(--red)', fontWeight: 700 }}>Log In Here</Link>
      </div>
    </section>
  );
}

// 2. Customer Registration (/register/customer)
export function CustomerRegister() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: 'Bagalkot',
    terms: false
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const update = (k, v) => setForm(old => ({ ...old, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }
    if (!form.terms) {
      setError('You must accept the Terms and Conditions to proceed.');
      return;
    }

    setBusy(true);
    try {
      const data = await api('auth/register/customer', {
        method: 'POST',
        body: form
      });
      saveSession(data);
      nav('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const handleGoogleSuccess = async (data) => {
    saveSession(data);
    nav('/dashboard', { replace: true });
  };

  return (
    <AuthShell
      title="Customer Registration"
      subtitle="Create a customer account to browse, rent, and book across Karnataka."
      badge="CUSTOMER REGISTRATION"
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Full Name
          <input
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. Ramesh Patil"
            value={form.name}
            onChange={e => update('name', e.target.value)}
          />
        </label>

        <div className="form-two">
          <label>
            Mobile Number
            <input
              required
              type="tel"
              pattern="[6-9][0-9]{9}"
              title="Enter valid 10-digit Indian mobile number"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
            />
          </label>
          <label>
            Email Address
            <input
              required
              type="email"
              placeholder="e.g. ramesh@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
          </label>
        </div>

        <div className="form-two">
          <label>
            Address / Locality
            <input
              placeholder="e.g. Station Road, Sector 12"
              value={form.address}
              onChange={e => update('address', e.target.value)}
            />
          </label>
          <label>
            City
            <input
              required
              placeholder="e.g. Bagalkot"
              value={form.city}
              onChange={e => update('city', e.target.value)}
            />
          </label>
        </div>

        <label>
          Password
          <PasswordInput
            value={form.password}
            onChange={e => update('password', e.target.value)}
            placeholder="At least 8 characters"
          />
        </label>

        <label>
          Confirm Password
          <PasswordInput
            value={form.confirmPassword}
            onChange={e => update('confirmPassword', e.target.value)}
            placeholder="Re-enter your password"
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={form.terms}
            onChange={e => update('terms', e.target.checked)}
            style={{ width: 'auto', marginTop: '3px' }}
          />
          <span>I accept the <a href="#terms" onClick={e => { e.preventDefault(); alert('Terms of Service: By registering, you agree to fair use of rental discovery, transport requests and local services across Karnataka.'); }} style={{ color: 'var(--red)', textDecoration: 'underline' }}>Terms and Conditions</a> of NUK RentServe.</span>
        </label>

        {error && <div className="notice error" role="alert">{error}</div>}

        <button className="btn btn-full" disabled={busy}>
          {busy ? 'Creating customer account…' : 'Register as Customer'}
        </button>

        <p className="form-note">
          Already registered? <Link to="/login"><b>Sign In Here</b></Link>
        </p>
      </form>

      <div className="auth-divider"><span>OR REGISTER WITH GOOGLE</span></div>
      <GoogleSignIn onSuccess={handleGoogleSuccess} onError={setError} busy={busy} />
    </AuthShell>
  );
}

// 3. Provider Registration (/register/provider)
export function ProviderRegister() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: 'Bagalkot',
    taluk: 'Bagalkot',
    district: 'Bagalkot',
    category: 'Electrician',
    experience: '3 years',
    price: '₹350 / visit',
    description: '',
    consent: false,
    terms: false
  });
  const [profileImage, setProfileImage] = useState(null);
  const [aadhaarDoc, setAadhaarDoc] = useState(null);
  const [addressProofDoc, setAddressProofDoc] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const update = (k, v) => setForm(old => ({ ...old, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!profileImage) {
      setError('A profile photograph is required for provider identification.');
      return;
    }
    if (!form.terms) {
      setError('You must accept the Terms and Conditions.');
      return;
    }
    if (!form.consent) {
      setError('You must give consent for identity and trade review.');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append('profileImage', profileImage);
      if (aadhaarDoc) fd.append('aadhaarDocument', aadhaarDoc);
      if (addressProofDoc) fd.append('addressProofDocument', addressProofDoc);

      const data = await api('auth/register/provider', {
        method: 'POST',
        body: fd
      });
      saveSession(data);
      nav('/provider/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Service Provider Application"
      subtitle="Register your trade. An administrator reviews your application before listings go live."
      badge="SERVICE PROVIDER ONBOARDING"
      asideTitle="Grow your business."
      asideSubtitle="Verified trade listings."
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Full Name / Trade Contact Name
          <input
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. Suresh Kumar"
            value={form.fullName}
            onChange={e => update('fullName', e.target.value)}
          />
        </label>

        <div className="form-two">
          <label>
            Mobile Number
            <input
              required
              type="tel"
              pattern="[6-9][0-9]{9}"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
            />
          </label>
          <label>
            Email Address
            <input
              required
              type="email"
              placeholder="e.g. suresh@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
          </label>
        </div>

        <div className="form-two">
          <label>
            Service Category
            <select value={form.category} onChange={e => update('category', e.target.value)}>
              <option value="Electrician">Electrician (ವಿದ್ಯುತ್ ತಜ್ಞ)</option>
              <option value="Plumber">Plumber (ಪ್ಲಂಬರ್)</option>
              <option value="Carpenter">Carpenter (ಬಡಗಿ)</option>
              <option value="Painter">Painter (ಪೇಂಟರ್)</option>
              <option value="Cleaning">Cleaning & Deep Wash</option>
              <option value="Appliance Repair">Appliance Repair</option>
              <option value="Other Services">Other Home & Commercial Services</option>
            </select>
          </label>
          <label>
            Years of Experience
            <input
              required
              placeholder="e.g. 4 years"
              value={form.experience}
              onChange={e => update('experience', e.target.value)}
            />
          </label>
        </div>

        <div className="form-two">
          <label>
            Indicative Rate / Visiting Fee
            <input
              placeholder="e.g. ₹350 / visit"
              value={form.price}
              onChange={e => update('price', e.target.value)}
            />
          </label>
          <label>
            City
            <input
              required
              placeholder="e.g. Bagalkot"
              value={form.city}
              onChange={e => update('city', e.target.value)}
            />
          </label>
        </div>

        <div className="form-two">
          <label>
            Taluk
            <input
              placeholder="e.g. Bagalkot"
              value={form.taluk}
              onChange={e => update('taluk', e.target.value)}
            />
          </label>
          <label>
            District
            <input
              placeholder="e.g. Bagalkot"
              value={form.district}
              onChange={e => update('district', e.target.value)}
            />
          </label>
        </div>

        <label>
          Full Address & Workshop Location
          <textarea
            rows={2}
            required
            placeholder="e.g. Near Kalmeshwar Temple, Vidyagiri, Bagalkot"
            value={form.address}
            onChange={e => update('address', e.target.value)}
          />
        </label>

        <label>
          Service Description & Scope of Work
          <textarea
            rows={3}
            required
            placeholder="Describe the services you provide, equipment handled, and areas you can visit..."
            value={form.description}
            onChange={e => update('description', e.target.value)}
          />
        </label>

        <label>
          Password
          <PasswordInput
            value={form.password}
            onChange={e => update('password', e.target.value)}
            placeholder="Create password (min 8 chars)"
          />
        </label>

        <div style={{ marginTop: '14px', padding: '16px', background: '#faf8f7', borderRadius: '12px', border: '1px solid var(--line)' }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>DOCUMENT SUBMISSION</span>
          <FileUploadPreview
            label="1. Profile Photograph"
            required
            file={profileImage}
            onChange={setProfileImage}
          />
          <FileUploadPreview
            label="2. Government ID / Aadhaar Document (Optional for initial demo, reviewed confidentially)"
            file={aadhaarDoc}
            onChange={setAadhaarDoc}
          />
          <FileUploadPreview
            label="3. Address Proof / Trade Proof Document"
            file={addressProofDoc}
            onChange={setAddressProofDoc}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '12px' }}>
          <input
            type="checkbox"
            checked={form.consent}
            onChange={e => update('consent', e.target.checked)}
            style={{ width: 'auto', marginTop: '3px' }}
          />
          <span>I give explicit consent for NUK RentServe administrators to review my identity and trade credentials for verification.</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={form.terms}
            onChange={e => update('terms', e.target.checked)}
            style={{ width: 'auto', marginTop: '3px' }}
          />
          <span>I accept the Service Provider Terms of Service.</span>
        </label>

        {error && <div className="notice error" role="alert">{error}</div>}

        <button className="btn btn-full" disabled={busy}>
          {busy ? 'Submitting Application…' : 'Submit Provider Application'}
        </button>

        <p className="form-note">
          Already an approved provider? <Link to="/provider/login"><b>Provider Sign In</b></Link>
        </p>
      </form>
    </AuthShell>
  );
}

// 4. Driver Registration (/register/driver)
export function DriverRegister() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: 'Bagalkot',
    taluk: 'Bagalkot',
    district: 'Bagalkot',
    vehicleType: 'auto',
    vehicleRegistrationNumber: '',
    drivingLicenceNumber: '',
    consent: false,
    terms: false
  });
  const [profileImage, setProfileImage] = useState(null);
  const [dlDoc, setDlDoc] = useState(null);
  const [rcDoc, setRcDoc] = useState(null);
  const [addressProofDoc, setAddressProofDoc] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const update = (k, v) => setForm(old => ({ ...old, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!profileImage) {
      setError('Profile photograph is required for driver verification.');
      return;
    }
    if (!dlDoc) {
      setError('Driving licence document upload is required.');
      return;
    }
    if (!form.terms) {
      setError('You must accept the Terms and Conditions.');
      return;
    }
    if (!form.consent) {
      setError('Explicit consent is required for driving licence and vehicle verification.');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append('profileImage', profileImage);
      fd.append('drivingLicenceDocument', dlDoc);
      if (rcDoc) fd.append('vehicleRcDocument', rcDoc);
      if (addressProofDoc) fd.append('addressProofDocument', addressProofDoc);

      const data = await api('auth/register/driver', {
        method: 'POST',
        body: fd
      });
      saveSession(data);
      nav('/driver/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Driver Onboarding"
      subtitle="Register your vehicle. Full trip fares go to you with 0% platform commission."
      badge="TRANSPORT DRIVER ONBOARDING"
      asideTitle="Drive with NUK."
      asideSubtitle="Fair rides & zero commission."
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Full Name (as on Driving Licence)
          <input
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. Basavaraj Badiger"
            value={form.fullName}
            onChange={e => update('fullName', e.target.value)}
          />
        </label>

        <div className="form-two">
          <label>
            Mobile Number (used for trip dispatches)
            <input
              required
              type="tel"
              pattern="[6-9][0-9]{9}"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
            />
          </label>
          <label>
            Email Address
            <input
              required
              type="email"
              placeholder="e.g. basavaraj@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
          </label>
        </div>

        <div className="form-two">
          <label>
            Vehicle Type
            <select value={form.vehicleType} onChange={e => update('vehicleType', e.target.value)}>
              <option value="auto">Auto Rickshaw (ಆಟೋ ರಿಕ್ಷಾ - 3 seater)</option>
              <option value="car">Passenger Car (ಕಾರು ಪ್ರಯಾಣ - 4-7 seater)</option>
              <option value="goods-van">Goods Van (ಸರಕು ಸಾಗಣೆ ವಾಹನ)</option>
            </select>
          </label>
          <label>
            Vehicle Registration Number (RC)
            <input
              required
              placeholder="e.g. KA 29 A 4589"
              value={form.vehicleRegistrationNumber}
              onChange={e => update('vehicleRegistrationNumber', e.target.value.toUpperCase())}
            />
          </label>
        </div>

        <div className="form-two">
          <label>
            Driving Licence Number
            <input
              required
              placeholder="e.g. KA2920150009876"
              value={form.drivingLicenceNumber}
              onChange={e => update('drivingLicenceNumber', e.target.value.toUpperCase())}
            />
          </label>
          <label>
            Operating City
            <input
              required
              placeholder="e.g. Bagalkot"
              value={form.city}
              onChange={e => update('city', e.target.value)}
            />
          </label>
        </div>

        <label>
          Residential Address
          <textarea
            rows={2}
            required
            placeholder="e.g. Old Station Road, Bagalkot"
            value={form.address}
            onChange={e => update('address', e.target.value)}
          />
        </label>

        <label>
          Account Password
          <PasswordInput
            value={form.password}
            onChange={e => update('password', e.target.value)}
            placeholder="Create password (min 8 chars)"
          />
        </label>

        <div style={{ marginTop: '14px', padding: '16px', background: '#faf8f7', borderRadius: '12px', border: '1px solid var(--line)' }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>MANDATORY DOCUMENTS</span>
          <FileUploadPreview
            label="1. Profile Photograph"
            required
            file={profileImage}
            onChange={setProfileImage}
          />
          <FileUploadPreview
            label="2. Driving Licence Document"
            required
            file={dlDoc}
            onChange={setDlDoc}
          />
          <FileUploadPreview
            label="3. Vehicle RC Document (Optional for initial demo)"
            file={rcDoc}
            onChange={setRcDoc}
          />
          <FileUploadPreview
            label="4. Address Proof Document"
            file={addressProofDoc}
            onChange={setAddressProofDoc}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '12px' }}>
          <input
            type="checkbox"
            checked={form.consent}
            onChange={e => update('consent', e.target.checked)}
            style={{ width: 'auto', marginTop: '3px' }}
          />
          <span>I give consent for NUK RentServe to verify my driving licence and vehicle RC for platform compliance.</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={form.terms}
            onChange={e => update('terms', e.target.checked)}
            style={{ width: 'auto', marginTop: '3px' }}
          />
          <span>I accept the Driver Partner Terms and Code of Conduct.</span>
        </label>

        {error && <div className="notice error" role="alert">{error}</div>}

        <button className="btn btn-full" disabled={busy}>
          {busy ? 'Registering Driver Account…' : 'Submit Driver Registration'}
        </button>

        <p className="form-note">
          Already registered as driver? <Link to="/driver/login"><b>Driver Sign In</b></Link>
        </p>
      </form>
    </AuthShell>
  );
}

// 5. Student Registration (/register/student)
export function StudentRegister() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    collegeName: '',
    studentIdNumber: '',
    address: '',
    city: 'Bagalkot',
    consent: false,
    terms: false
  });
  const [idCardDoc, setIdCardDoc] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const update = (k, v) => setForm(old => ({ ...old, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!idCardDoc) {
      setError('Student ID card document upload is required for verification.');
      return;
    }
    if (!form.terms) {
      setError('You must accept the Terms and Conditions.');
      return;
    }
    if (!form.consent) {
      setError('Consent is required to verify your college student status.');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append('studentIdCardDocument', idCardDoc);

      const data = await api('auth/register/student', {
        method: 'POST',
        body: fd
      });
      saveSession(data);
      nav('/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Student Partner Registration"
      subtitle="Verify your college status to access student housing, flatmate matching and rental benefits."
      badge="STUDENT VERIFICATION"
      asideTitle="Student Housing."
      asideSubtitle="Direct from verified owners."
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Full Name (as on College ID)
          <input
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. Ananya Kulkarni"
            value={form.fullName}
            onChange={e => update('fullName', e.target.value)}
          />
        </label>

        <div className="form-two">
          <label>
            Mobile Number
            <input
              required
              type="tel"
              pattern="[6-9][0-9]{9}"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
            />
          </label>
          <label>
            Email Address (college or personal)
            <input
              required
              type="email"
              placeholder="e.g. ananya@college.edu"
              value={form.email}
              onChange={e => update('email', e.target.value)}
            />
          </label>
        </div>

        <div className="form-two">
          <label>
            College / University Name
            <input
              required
              placeholder="e.g. Basaveshwar Engineering College, Bagalkot"
              value={form.collegeName}
              onChange={e => update('collegeName', e.target.value)}
            />
          </label>
          <label>
            Student Roll / USN Number
            <input
              required
              placeholder="e.g. 2BA21CS045"
              value={form.studentIdNumber}
              onChange={e => update('studentIdNumber', e.target.value.toUpperCase())}
            />
          </label>
        </div>

        <div className="form-two">
          <label>
            College Locality / Hostels
            <input
              placeholder="e.g. Vidyagiri Hostel Block B"
              value={form.address}
              onChange={e => update('address', e.target.value)}
            />
          </label>
          <label>
            City
            <input
              required
              placeholder="e.g. Bagalkot"
              value={form.city}
              onChange={e => update('city', e.target.value)}
            />
          </label>
        </div>

        <label>
          Account Password
          <PasswordInput
            value={form.password}
            onChange={e => update('password', e.target.value)}
            placeholder="Create password (min 8 chars)"
          />
        </label>

        <div style={{ marginTop: '14px', padding: '16px', background: '#faf8f7', borderRadius: '12px', border: '1px solid var(--line)' }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>COLLEGE ID UPLOAD</span>
          <FileUploadPreview
            label="College Student ID Card (Photo or PDF)"
            required
            file={idCardDoc}
            onChange={setIdCardDoc}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '12px' }}>
          <input
            type="checkbox"
            checked={form.consent}
            onChange={e => update('consent', e.target.checked)}
            style={{ width: 'auto', marginTop: '3px' }}
          />
          <span>I consent to NUK RentServe verifying my college student identity card.</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={form.terms}
            onChange={e => update('terms', e.target.checked)}
            style={{ width: 'auto', marginTop: '3px' }}
          />
          <span>I accept the Student Partner Terms and Community Rules.</span>
        </label>

        {error && <div className="notice error" role="alert">{error}</div>}

        <button className="btn btn-full" disabled={busy}>
          {busy ? 'Registering Student…' : 'Submit Student Registration'}
        </button>

        <p className="form-note">
          Already verified? <Link to="/student/login"><b>Student Sign In</b></Link>
        </p>
      </form>
    </AuthShell>
  );
}
