import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, readUser, unwrapItems } from '../services/api';

const statusLabel = (val) =>
  ({
    pending: 'Student Verification Pending',
    approved: 'Verified Student Partner',
    verified: 'Verified Student Partner',
    rejected: 'Verification Action Required',
    suspended: 'Account Suspended'
  }[val] || val || 'Under Review');

export default function StudentDashboard() {
  const user = readUser();
  const [studentInfo, setStudentInfo] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [appRes, rentalsRes] = await Promise.allSettled([
          api('admin/provider-applications').catch(() => null),
          api('properties', { query: { type: 'room,PG', limit: 8 } })
        ]);

        if (rentalsRes.status === 'fulfilled') {
          setRentals(unwrapItems(rentalsRes.value));
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!user || (user.role !== 'student' && user.role !== 'admin')) {
    return <Navigate to="/student/login" replace />;
  }

  const appStatus = user.approvalStatus || 'pending';
  const isApproved = appStatus === 'approved' || appStatus === 'verified';
  const isRejected = appStatus === 'rejected';

  async function submitCorrectedCard(e) {
    e.preventDefault();
    if (!resubmitFile) return;
    setResubmitting(true);
    setResubmitSuccess('');
    setError('');
    try {
      const fd = new FormData();
      fd.append('studentIdCardDocument', resubmitFile);
      await api('documents/resubmit', { method: 'POST', body: fd });
      setResubmitSuccess('Student ID card re-uploaded! An administrator will review your submission.');
      setResubmitFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setResubmitting(false);
    }
  }

  return (
    <section className="wrap section student-dashboard" style={{ maxWidth: '1000px', margin: '30px auto' }}>
      <div className="page-title">
        <span className="eyebrow">STUDENT PORTAL</span>
        <h1>Student Partner Workspace</h1>
        <p className="muted">Verified campus housing, shared room matching and zero-brokerage accommodation.</p>
      </div>

      {/* Verification Status Banner */}
      <div
        className="provider-status-panel"
        style={{
          borderLeft: isApproved ? '6px solid #16713c' : isRejected ? '6px solid var(--red)' : '6px solid #f0b800'
        }}
      >
        <div>
          <span className="eyebrow">COLLEGE VERIFICATION</span>
          <h2>{statusLabel(appStatus)}</h2>
          <p>
            {isApproved
              ? 'Your college student identity is verified. You have full access to student housing discounts, verified roommate boards, and direct owner listings.'
              : isRejected
              ? `Verification issue: ${user.rejectionReason || 'Your student ID card could not be verified. Please re-upload a clear photo below.'}`
              : 'Your student ID submission is currently under review by an administrator. Verified student privileges will unlock upon approval.'}
          </p>
        </div>
        <span className={`status-pill status-${appStatus}`}>{appStatus.toUpperCase()}</span>
      </div>

      {notice && <div className="notice" role="status">{notice}</div>}
      {error && <div className="notice error" role="alert">{error}</div>}

      {/* Document Resubmission Form for Rejected Students */}
      {isRejected && (
        <div style={{ background: '#fff0f2', border: '1px solid #ffd0d6', padding: '24px', borderRadius: '16px', margin: '20px 0' }}>
          <span className="eyebrow" style={{ color: 'var(--red)' }}>CORRECTION REQUIRED</span>
          <h3 style={{ margin: '8px 0' }}>Re-upload Student ID Card</h3>
          <p className="muted" style={{ fontSize: '14px' }}>
            Ensure your full name, college name, and valid academic year are clearly legible.
          </p>
          <form onSubmit={submitCorrectedCard} style={{ display: 'grid', gap: '14px', maxWidth: '500px' }}>
            <input
              type="file"
              required
              accept="image/*,application/pdf"
              onChange={e => setResubmitFile(e.target.files?.[0] || null)}
              style={{ padding: '8px', background: '#fff', border: '1px solid var(--line)', borderRadius: '8px' }}
            />
            {resubmitSuccess && <div className="notice success">{resubmitSuccess}</div>}
            <button className="btn" disabled={resubmitting}>
              {resubmitting ? 'Submitting ID card…' : 'Submit ID Card for Review'}
            </button>
          </form>
        </div>
      )}

      {/* Profile Overview */}
      <div className="dashboard-grid" style={{ margin: '24px 0' }}>
        <article className="dashboard-card">
          <span className="eyebrow">STUDENT PROFILE</span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <small>Campus City: {user.location}</small>
        </article>
        <article className="dashboard-card">
          <span className="eyebrow">PARTNERSHIP PRIVILEGE</span>
          <h2>0% Brokerage</h2>
          <p>Verified students pay zero commission on student rentals.</p>
        </article>
        <article className="dashboard-card">
          <span className="eyebrow">COMMISSION EARNINGS</span>
          <h2>₹0.00</h2>
          <p>Direct peer rental referral balance (100% payout to student).</p>
        </article>
      </div>

      {/* Recommended Student Accommodations */}
      <div className="section-head">
        <div>
          <span className="eyebrow">STUDENT HOUSING</span>
          <h2>Verified Rooms & PGs Near Campuses</h2>
          <p className="muted">Direct from local owners with student-friendly deposits.</p>
        </div>
        <Link to="/rentals?type=PG" className="btn btn-outline">View All PGs →</Link>
      </div>

      {rentals.length ? (
        <div className="enquiry-list">
          {rentals.map(r => (
            <article className="enquiry-card" key={r._id || r.id}>
              <div>
                <span className="eyebrow">{r.type?.toUpperCase()} · ₹{r.rent} / {r.rentPeriod || 'month'}</span>
                <h3>{r.title}</h3>
                <p>{r.address || r.location}</p>
                <small>Deposit: ₹{r.deposit || 0} · Facilities: {(r.facilities || []).join(', ') || 'Standard'}</small>
              </div>
              <div>
                <Link to={`/rentals/${r._id || r.id}`} className="btn btn-small">
                  View Details →
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No student rentals listed right now</h3>
          <p>Check back soon or browse all available properties in Bagalkot and surrounding districts.</p>
          <Link to="/rentals" className="btn" style={{ marginTop: '12px' }}>Explore Rentals</Link>
        </div>
      )}
    </section>
  );
}
