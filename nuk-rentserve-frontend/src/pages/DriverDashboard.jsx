import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, readUser, unwrapItems } from '../services/api';
import TransportChat from '../components/TransportChat.jsx';
import TransportTripTracker from '../components/TransportTripTracker.jsx';

const statusLabel = (val) =>
  ({
    pending: 'Pending Administrator Review',
    approved: 'Verified & Active Driver',
    verified: 'Verified & Active Driver',
    rejected: 'Documents Rejected / Action Required',
    suspended: 'Account Suspended'
  }[val] || val || 'Under Review');

export default function DriverDashboard() {
  const user = readUser();
  const [profile, setProfile] = useState(null);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionId, setActionId] = useState('');
  const [online, setOnline] = useState(true);
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitDocType, setResubmitDocType] = useState('drivingLicenceDocument');
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      api('providers/me'),
      api('transport-bookings/available'),
      api('transport-bookings/assigned')
    ]);

    if (results[0].status === 'fulfilled') setProfile(results[0].value);
    if (results[1].status === 'fulfilled') setAvailableRequests(unwrapItems(results[1].value));
    if (results[2].status === 'fulfilled') setAssignedTrips(unwrapItems(results[2].value));

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (!user || (user.role !== 'driver' && user.role !== 'admin')) {
    return <Navigate to="/driver/login" replace />;
  }

  const appStatus = user.approvalStatus || profile?.verificationStatus || 'pending';
  const isApproved = appStatus === 'approved' || appStatus === 'verified';
  const isRejected = appStatus === 'rejected';

  // Driver shares GPS location for nearby auto/car trip dispatching
  async function shareLocation() {
    setNotice('');
    if (!navigator.geolocation) {
      setNotice('GPS is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api('transport-bookings/location', {
            method: 'PATCH',
            body: {
              locationCoordinates: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              }
            }
          });
          setNotice('GPS location updated successfully! Nearby customers can now match with you.');
          loadData();
        } catch (e) {
          setNotice(e.message);
        }
      },
      () => setNotice('Location permission denied. Please enable GPS permissions.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Accept or decline trip
  async function handleTripAction(id, status) {
    setActionId(id);
    setNotice('');
    try {
      await api(`transport-bookings/${id}/status`, {
        method: 'PATCH',
        body: { status }
      });
      setNotice(status === 'accepted' ? 'Trip accepted! Contact the customer in the trip tracker below.' : 'Trip declined.');
      loadData();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setActionId('');
    }
  }

  // Document resubmission for rejected drivers
  async function submitCorrectedDocument(e) {
    e.preventDefault();
    if (!resubmitFile) return;
    setResubmitting(true);
    setResubmitSuccess('');
    setError('');
    try {
      const fd = new FormData();
      fd.append(resubmitDocType, resubmitFile);
      await api('documents/resubmit', { method: 'POST', body: fd });
      setResubmitSuccess('Document resubmitted! An administrator will re-evaluate your application.');
      setResubmitFile(null);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setResubmitting(false);
    }
  }

  return (
    <section className="wrap section driver-dashboard" style={{ maxWidth: '1100px', margin: '30px auto' }}>
      <div className="page-title">
        <span className="eyebrow">DRIVER CONSOLE</span>
        <h1>Driver Workspace</h1>
        <p className="muted">Manage trips, update live location, and receive real-time ride requests.</p>
      </div>

      {/* Verification Status Banner */}
      <div
        className="provider-status-panel"
        style={{
          borderLeft: isApproved ? '6px solid #16713c' : isRejected ? '6px solid var(--red)' : '6px solid #f0b800'
        }}
      >
        <div>
          <span className="eyebrow">VERIFICATION STATUS</span>
          <h2>{statusLabel(appStatus)}</h2>
          <p>
            {isApproved
              ? 'Your licence and vehicle documents are verified. You are authorized to accept trips and receive live GPS bookings.'
              : isRejected
              ? `Verification rejected: ${user.rejectionReason || 'Please review your licence or vehicle documents and re-upload below.'}`
              : 'Your application is under administrator review. Once your driving licence and vehicle details are confirmed, live ride requests will unlock.'}
          </p>
        </div>
        <span className={`status-pill status-${appStatus}`}>
          {appStatus.toUpperCase()}
        </span>
      </div>

      {notice && <div className="notice" role="status">{notice}</div>}
      {error && <div className="notice error" role="alert">{error}</div>}

      {/* Document Resubmission Form for Rejected Drivers */}
      {isRejected && (
        <div style={{ background: '#fff0f2', border: '1px solid #ffd0d6', padding: '24px', borderRadius: '16px', margin: '20px 0' }}>
          <span className="eyebrow" style={{ color: 'var(--red)' }}>CORRECTION REQUIRED</span>
          <h3 style={{ margin: '8px 0' }}>Resubmit Driver Documents</h3>
          <p className="muted" style={{ fontSize: '14px' }}>
            Upload a clear copy of your driving licence or vehicle RC to resolve the rejection note above.
          </p>
          <form onSubmit={submitCorrectedDocument} style={{ display: 'grid', gap: '14px', maxWidth: '500px' }}>
            <label>
              Document to replace
              <select value={resubmitDocType} onChange={e => setResubmitDocType(e.target.value)}>
                <option value="drivingLicenceDocument">Driving Licence (DL)</option>
                <option value="vehicleRcDocument">Vehicle RC Document</option>
                <option value="addressProofDocument">Address Proof Document</option>
              </select>
            </label>
            <input
              type="file"
              required
              accept="image/*,application/pdf"
              onChange={e => setResubmitFile(e.target.files?.[0] || null)}
              style={{ padding: '8px', background: '#fff', border: '1px solid var(--line)', borderRadius: '8px' }}
            />
            {resubmitSuccess && <div className="notice success">{resubmitSuccess}</div>}
            <button className="btn" disabled={resubmitting}>
              {resubmitting ? 'Uploading document…' : 'Submit Document for Review'}
            </button>
          </form>
        </div>
      )}

      {/* Metrics Row */}
      <div className="dashboard-grid" style={{ margin: '24px 0' }}>
        <article className="dashboard-card">
          <span className="eyebrow">DRIVER IDENTITY</span>
          <h2>{user.name}</h2>
          <p>{user.phone || user.email}</p>
          <small>City: {user.location}</small>
        </article>
        <article className="dashboard-card">
          <span className="eyebrow">DUTY STATUS</span>
          <h2>{online ? 'Online' : 'Offline'}</h2>
          <p>
            <button
              className="btn btn-small"
              onClick={() => setOnline(o => !o)}
              style={{ marginTop: '8px' }}
            >
              Toggle to {online ? 'Go Offline' : 'Go Online'}
            </button>
          </p>
        </article>
        <article className="dashboard-card">
          <span className="eyebrow">ACTIVE TRIPS</span>
          <h2>{assignedTrips.length}</h2>
          <p>Assigned trips currently in progress.</p>
        </article>
      </div>

      {/* GPS Location Share Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid var(--line)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px' }}>
        <div>
          <b>Live GPS Matching</b>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>Broadcast current location to receive nearest auto & car requests.</p>
        </div>
        <button className="btn btn-small" onClick={shareLocation} disabled={!isApproved}>
          Update GPS Location
        </button>
      </div>

      {/* Available Trip Requests */}
      <div className="section-head">
        <div>
          <span className="eyebrow">NEARBY DISPATCH</span>
          <h2>Available Ride Requests ({availableRequests.length})</h2>
          <p className="muted">Direct customer transport requests matching your vehicle category.</p>
        </div>
        <button className="btn btn-outline" onClick={loadData}>Refresh</button>
      </div>

      {!isApproved ? (
        <div className="empty-state">
          <h3>Verification Required</h3>
          <p>New trip requests will be dispatched here once your documents are approved by an administrator.</p>
        </div>
      ) : availableRequests.length ? (
        <div className="enquiry-list">
          {availableRequests.map((req) => (
            <article className="enquiry-card" key={req._id}>
              <div>
                <span className="eyebrow">{req.vehicleType?.toUpperCase()} · ₹{req.fare || 50} estimated</span>
                <h3>{req.pickup} → {req.destination}</h3>
                <p>Scheduled: {new Date(req.scheduledAt).toLocaleString()}</p>
                <small>Passenger: {req.customerId?.name || 'Customer'} {req.customerId?.phone ? `(${req.customerId.phone})` : ''}</small>
                {req.details && <p className="muted" style={{ fontSize: '13px', marginTop: '4px' }}>Notes: {req.details}</p>}
              </div>
              <div className="provider-actions">
                <button
                  className="btn"
                  disabled={actionId === req._id}
                  onClick={() => handleTripAction(req._id, 'accepted')}
                >
                  {actionId === req._id ? 'Accepting…' : 'Accept Ride'}
                </button>
                <button
                  className="btn btn-outline"
                  disabled={actionId === req._id}
                  onClick={() => handleTripAction(req._id, 'declined')}
                >
                  Decline
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No ride requests right now</h3>
          <p>New customer ride requests will appear here in real time. Keep your GPS updated.</p>
        </div>
      )}

      {/* Assigned / Active Trips */}
      <div className="section-head" style={{ marginTop: '40px' }}>
        <div>
          <span className="eyebrow">ACTIVE TRIPS</span>
          <h2>Your Assigned Trips ({assignedTrips.length})</h2>
        </div>
      </div>

      {assignedTrips.length ? (
        <div className="enquiry-list">
          {assignedTrips.map((trip) => (
            <article className="enquiry-card accepted-trip-card" key={trip._id} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="eyebrow">{trip.vehicleType} · STATUS: {trip.status}</span>
                  <span style={{ fontWeight: 800, color: 'var(--red)' }}>₹{trip.fare || 60}</span>
                </div>
                <h3>{trip.pickup} → {trip.destination}</h3>
                <p>Pickup time: {new Date(trip.scheduledAt).toLocaleString()}</p>
                <small>Customer: {trip.customerId?.name || 'Customer'} · Phone: {trip.customerId?.phone || 'Provided upon pickup'}</small>
              </div>

              {/* Trip Tracker component with Leaflet Map */}
              <TransportTripTracker booking={trip} role="driver" onChanged={loadData} />

              {/* In-Trip Chat */}
              <TransportChat bookingId={trip._id} title={`Customer Chat · ${trip.pickup}`} />
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Accepted trips will appear here with live tracking, turn coordinates and customer chat.</p>
        </div>
      )}
    </section>
  );
}
