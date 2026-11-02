import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, readUser, unwrapItems } from '../services/api';

export default function AdminDashboard() {
  const user = readUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appTypeFilter, setAppTypeFilter] = useState('all');
  const [appStatusFilter, setAppStatusFilter] = useState('pending');
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [auditLogs, setAuditLogs] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [rejectionModal, setRejectionModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [documentModal, setDocumentModal] = useState(null);

  // Authentication & Role Check
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  // Load Admin Data
  async function loadAllData() {
    setLoading(true);
    setError('');
    try {
      const [statsRes, appsRes, usersRes, logsRes, ticketsRes] = await Promise.allSettled([
        api('admin/stats'),
        api('admin/applications', { query: { type: appTypeFilter, status: appStatusFilter } }),
        api('admin/users', { query: { limit: 100 } }),
        api('admin/audit-logs', { query: { limit: 50 } }),
        api('support')
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (appsRes.status === 'fulfilled') setApplications(unwrapItems(appsRes.value));
      if (usersRes.status === 'fulfilled') {
        const uData = usersRes.value;
        setUsers(Array.isArray(uData?.users) ? uData.users : unwrapItems(uData));
      }
      if (logsRes.status === 'fulfilled') {
        const lData = logsRes.value;
        setAuditLogs(Array.isArray(lData?.logs) ? lData.logs : unwrapItems(lData));
      }
      if (ticketsRes.status === 'fulfilled') setSupportTickets(unwrapItems(ticketsRes.value));

      const failure = [statsRes, appsRes, usersRes].find(r => r.status === 'rejected');
      if (failure) {
        setError(failure.reason?.message || 'Some administrative data could not be fetched.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, [appTypeFilter, appStatusFilter]);

  // Decide application (Approve, Reject, Request Info)
  async function decide(id, decision, reason = '') {
    setBusyId(id);
    setNotice('');
    try {
      await api(`admin/applications/${id}`, {
        method: 'PATCH',
        body: { decision, note: reason }
      });
      setNotice(`Application ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'updated'}. User permissions updated.`);
      setRejectionModal(null);
      setRejectionReason('');
      await loadAllData();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusyId('');
    }
  }

  // Identity review verification (Aadhaar match)
  async function submitIdentityReview(app, status) {
    const note =
      status === 'match'
        ? 'Identity details reviewed and matched by admin.'
        : status === 'possible_mismatch'
        ? 'Identity details require clarification.'
        : 'Manual review required.';
    try {
      await api(`admin/provider-applications/${app.id || app._id}/identity-review`, {
        method: 'PATCH',
        body: { status, aadhaarName: app.aadhaarName || app.fullName || app.name, note }
      });
      setNotice('Identity review status saved.');
      await loadAllData();
    } catch (e) {
      setNotice(e.message);
    }
  }

  // User active state toggle
  async function toggleUserActive(targetUser) {
    try {
      await api(`admin/users/${targetUser._id || targetUser.id}/status`, {
        method: 'PATCH',
        body: { isActive: targetUser.isActive === false }
      });
      setNotice(`User ${targetUser.name} active state updated.`);
      await loadAllData();
    } catch (e) {
      setNotice(e.message);
    }
  }

  // User suspension toggle
  async function handleSuspend(targetUser, action, reason = '') {
    try {
      await api(`admin/users/${targetUser._id || targetUser.id}/suspend`, {
        method: 'PATCH',
        body: { action, reason }
      });
      setNotice(`User ${targetUser.name} ${action === 'suspend' ? 'suspended' : 're-instated'}.`);
      setSuspendModal(null);
      setSuspendReason('');
      await loadAllData();
    } catch (e) {
      setNotice(e.message);
    }
  }

  // Update Support Ticket Status
  async function updateTicketStatus(ticketId, status) {
    try {
      await api(`support/${ticketId}/status`, {
        method: 'PATCH',
        body: { status }
      });
      setNotice('Support ticket updated.');
      await loadAllData();
    } catch (e) {
      setNotice(e.message);
    }
  }

  const filteredUsers = users.filter(u => userRoleFilter === 'all' || u.role === userRoleFilter);

  return (
    <section className="wrap section admin-dashboard" style={{ maxWidth: '1200px', margin: '30px auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="eyebrow" style={{ color: 'var(--red)' }}>ADMINISTRATOR CONTROL CONSOLE</span>
          <h1>Admin Dashboard</h1>
          <p className="muted" style={{ margin: 0 }}>
            Live governance data from MongoDB Atlas. Verification, approval, user management and system audits.
          </p>
        </div>
        <button className="btn btn-outline" onClick={loadAllData} disabled={loading}>
          {loading ? 'Refreshing…' : '🔄 Refresh Data'}
        </button>
      </div>

      {notice && <div className="notice" role="status" style={{ marginTop: '16px' }}>{notice}</div>}
      {error && <div className="notice error" role="alert" style={{ marginTop: '16px' }}>{error}</div>}

      {/* Navigation Tabs */}
      <div
        className="search-tabs"
        role="tablist"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '2px solid var(--line)',
          margin: '24px 0 20px',
          paddingBottom: '8px'
        }}
      >
        {[
          ['overview', '📊 Overview'],
          ['applications', `📋 Applications (${stats?.pendingProviders || 0 + (stats?.pendingDrivers || 0) + (stats?.pendingStudents || 0)} Pending)`],
          ['users', `👥 User Management (${stats?.totalUsers || users.length})`],
          ['audit', '📜 Audit Logs'],
          ['support', `🎧 Support Tickets (${supportTickets.length})`]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? 'btn btn-small' : 'btn btn-small btn-outline'}
            onClick={() => setActiveTab(key)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div>
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <article className="dashboard-card" style={{ borderLeft: '4px solid #16713c' }}>
              <span className="eyebrow">TOTAL GENUINE USERS</span>
              <h2>{stats?.totalUsers ?? users.length}</h2>
              <small>Customers, Providers, Drivers, Students</small>
            </article>
            <article className="dashboard-card" style={{ borderLeft: '4px solid #c51d37' }}>
              <span className="eyebrow">PENDING APPLICATIONS</span>
              <h2 style={{ color: 'var(--red)' }}>
                {(stats?.pendingProviders || 0) + (stats?.pendingDrivers || 0) + (stats?.pendingStudents || 0)}
              </h2>
              <small>
                {stats?.pendingProviders || 0} providers · {stats?.pendingDrivers || 0} drivers · {stats?.pendingStudents || 0} students
              </small>
            </article>
            <article className="dashboard-card" style={{ borderLeft: '4px solid #2454a6' }}>
              <span className="eyebrow">ACTIVE VERIFIED PROVIDERS</span>
              <h2>{stats?.approvedProviders ?? 0}</h2>
              <small>Approved trade specialists</small>
            </article>
            <article className="dashboard-card" style={{ borderLeft: '4px solid #e89800' }}>
              <span className="eyebrow">ACTIVE VERIFIED DRIVERS</span>
              <h2>{stats?.approvedDrivers ?? 0}</h2>
              <small>Approved auto & car operators</small>
            </article>
            <article className="dashboard-card" style={{ borderLeft: '4px solid #8e44ad' }}>
              <span className="eyebrow">VERIFIED STUDENTS</span>
              <h2>{stats?.approvedStudents ?? 0}</h2>
              <small>College verified partners</small>
            </article>
            <article className="dashboard-card" style={{ borderLeft: '4px solid #7f8c8d' }}>
              <span className="eyebrow">SUSPENDED ACCOUNTS</span>
              <h2>{stats?.suspendedAccounts ?? 0}</h2>
              <small>Accounts blocked by security</small>
            </article>
          </div>

          <div style={{ marginTop: '28px', padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid var(--line)' }}>
            <span className="eyebrow">QUICK ACTION DESK</span>
            <h3 style={{ margin: '8px 0 16px' }}>Pending Approvals Summary</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-small"
                onClick={() => {
                  setAppTypeFilter('provider');
                  setAppStatusFilter('pending');
                  setActiveTab('applications');
                }}
              >
                Review Providers ({stats?.pendingProviders || 0})
              </button>
              <button
                className="btn btn-small"
                onClick={() => {
                  setAppTypeFilter('driver');
                  setAppStatusFilter('pending');
                  setActiveTab('applications');
                }}
              >
                Review Drivers ({stats?.pendingDrivers || 0})
              </button>
              <button
                className="btn btn-small"
                onClick={() => {
                  setAppTypeFilter('student');
                  setAppStatusFilter('pending');
                  setActiveTab('applications');
                }}
              >
                Review Students ({stats?.pendingStudents || 0})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICATIONS & DOCUMENT VERIFICATION */}
      {activeTab === 'applications' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              Type:
              <select
                value={appTypeFilter}
                onChange={e => setAppTypeFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--line)', background: '#fff' }}
              >
                <option value="all">All Roles</option>
                <option value="provider">Service Providers</option>
                <option value="driver">Transport Drivers</option>
                <option value="student">Student Partners</option>
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              Status:
              <select
                value={appStatusFilter}
                onChange={e => setAppStatusFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--line)', background: '#fff' }}
              >
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Statuses</option>
              </select>
            </label>
          </div>

          {applications.length ? (
            <div className="enquiry-list">
              {applications.map(app => (
                <article
                  className="enquiry-card"
                  key={app.id || app._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    gap: '20px',
                    alignItems: 'start',
                    borderLeft: app.status === 'approved' ? '5px solid #16713c' : app.status === 'rejected' ? '5px solid var(--red)' : '5px solid #f0b800'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="eyebrow" style={{ color: 'var(--red)' }}>
                        {app.applicationType?.toUpperCase() || 'PROVIDER'}
                      </span>
                      <span className={`status-pill status-${app.status}`}>
                        {app.status?.toUpperCase()}
                      </span>
                      {app.isDemo && (
                        <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>
                          DEMO RECORD
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '4px 0' }}>{app.fullName || app.name}</h3>
                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                      <b>Contact:</b> {app.email} · {app.phone} · <b>Location:</b> {app.city}, {app.taluk || app.district}
                    </p>

                    {/* Role Specific Fields */}
                    {app.applicationType === 'driver' && (
                      <div style={{ background: '#fcfaf9', padding: '10px 14px', borderRadius: '8px', margin: '8px 0', fontSize: '13px' }}>
                        🚗 <b>Vehicle:</b> {app.vehicleType?.toUpperCase()} ({app.vehicleRegistrationNumber || 'Reg pending'}) · <b>DL Number:</b> {app.drivingLicenceNumber || 'Not specified'}
                      </div>
                    )}

                    {app.applicationType === 'student' && (
                      <div style={{ background: '#fcfaf9', padding: '10px 14px', borderRadius: '8px', margin: '8px 0', fontSize: '13px' }}>
                        🎓 <b>College:</b> {app.collegeName} · <b>Student ID:</b> {app.studentIdNumber}
                      </div>
                    )}

                    {app.applicationType === 'provider' && (
                      <div style={{ background: '#fcfaf9', padding: '10px 14px', borderRadius: '8px', margin: '8px 0', fontSize: '13px' }}>
                        🛠️ <b>Category:</b> {app.category} · <b>Experience:</b> {app.experience} · <b>Price:</b> {app.price}
                        {app.description && <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>{app.description}</p>}
                      </div>
                    )}

                    {/* Documents List & Verification Viewers */}
                    <div style={{ marginTop: '12px' }}>
                      <span className="eyebrow" style={{ fontSize: '11px' }}>DOCUMENTS ATTACHED:</span>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {app.aadhaarDocumentAvailable && (
                          <button
                            type="button"
                            className="btn btn-small btn-outline"
                            onClick={() => setDocumentModal({ title: `Aadhaar ID - ${app.fullName}`, url: `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/admin/applications/${app.id || app._id}/document/aadhaarDocument` })}
                          >
                            📄 View Masked Aadhaar
                          </button>
                        )}
                        {app.drivingLicenceAvailable && (
                          <button
                            type="button"
                            className="btn btn-small btn-outline"
                            onClick={() => setDocumentModal({ title: `Driving Licence - ${app.fullName}`, url: `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/admin/applications/${app.id || app._id}/document/drivingLicenceDocument` })}
                          >
                            🪪 View Driving Licence
                          </button>
                        )}
                        {app.studentIdCardAvailable && (
                          <button
                            type="button"
                            className="btn btn-small btn-outline"
                            onClick={() => setDocumentModal({ title: `Student College ID - ${app.fullName}`, url: `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/admin/applications/${app.id || app._id}/document/studentIdCardDocument` })}
                          >
                            🎓 View College ID
                          </button>
                        )}
                        {app.vehicleRcAvailable && (
                          <button
                            type="button"
                            className="btn btn-small btn-outline"
                            onClick={() => setDocumentModal({ title: `Vehicle RC - ${app.fullName}`, url: `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/admin/applications/${app.id || app._id}/document/vehicleRcDocument` })}
                          >
                            🚙 View Vehicle RC
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Review Note Display if Present */}
                    {app.reviewNote && (
                      <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                        <b>Admin note:</b> {app.reviewNote}
                      </p>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                    <button
                      className="btn btn-small"
                      disabled={busyId === (app.id || app._id) || app.status === 'approved'}
                      onClick={() => decide(app.id || app._id, 'approve', 'Approved after administrator document review.')}
                      style={{ background: '#16713c', borderColor: '#16713c' }}
                    >
                      {busyId === (app.id || app._id) ? 'Saving…' : '✓ Approve'}
                    </button>

                    <button
                      className="btn btn-small btn-outline"
                      disabled={busyId === (app.id || app._id)}
                      onClick={() => {
                        setRejectionModal(app);
                        setRejectionReason('Documents could not be clearly verified. Please re-upload legible files.');
                      }}
                      style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                    >
                      ✕ Reject / Request Fix
                    </button>

                    <button
                      className="btn btn-small btn-outline"
                      disabled={busyId === (app.id || app._id)}
                      onClick={() => decide(app.id || app._id, 'info', 'Clarification requested on address proof.')}
                    >
                      ℹ Request Info
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>📋</span>
              <h3>No applications matching filter</h3>
              <p>Applications submitted by Providers, Drivers, and Students will appear here for verification.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT & SUSPENSION */}
      {activeTab === 'users' && (
        <div>
          {/* Role Filter */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Filter by Role:</span>
            {['all', 'customer', 'provider', 'driver', 'student', 'admin'].map(r => (
              <button
                key={r}
                type="button"
                className={userRoleFilter === r ? 'btn btn-small' : 'btn btn-small btn-outline'}
                onClick={() => setUserRoleFilter(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="enquiry-list">
            {filteredUsers.map(u => (
              <article
                className="enquiry-card"
                key={u._id || u.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="eyebrow">{u.role?.toUpperCase()}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontWeight: 700,
                        background: u.isActive === false ? '#ffe4e6' : '#e4f7eb',
                        color: u.isActive === false ? '#9f1239' : '#166534'
                      }}
                    >
                      {u.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                    </span>
                    {u.approvalStatus === 'suspended' && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>
                        SUSPENDED
                      </span>
                    )}
                    {u.isDemo && (
                      <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        DEMO
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: '4px 0' }}>{u.name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                    {u.email} {u.phone ? `· ${u.phone}` : ''} · {u.location || 'Bagalkot'}
                  </p>
                  {u.suspendedReason && (
                    <small style={{ color: 'var(--red)', display: 'block', marginTop: '4px' }}>
                      Suspension reason: {u.suspendedReason}
                    </small>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Active / Inactive Toggle */}
                  <button
                    className="btn btn-small btn-outline"
                    disabled={u.role === 'admin'}
                    onClick={() => toggleUserActive(u)}
                  >
                    {u.isActive === false ? 'Reactivate' : 'Deactivate'}
                  </button>

                  {/* Suspend / Unsuspend */}
                  {u.approvalStatus === 'suspended' ? (
                    <button
                      className="btn btn-small"
                      onClick={() => handleSuspend(u, 'unsuspend')}
                      style={{ background: '#16713c', borderColor: '#16713c' }}
                    >
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      className="btn btn-small btn-outline"
                      disabled={u.role === 'admin'}
                      onClick={() => {
                        setSuspendModal(u);
                        setSuspendReason('Violation of platform safety policies or fraudulent document submission.');
                      }}
                      style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                    >
                      Suspend Account
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div>
          <div className="section-head">
            <div>
              <span className="eyebrow">SYSTEM SECURITY AUDIT</span>
              <h2>Activity & Audit Trail</h2>
              <p className="muted">Permanent chronological record of logins, role updates, suspensions and approvals.</p>
            </div>
          </div>

          {auditLogs.length ? (
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#faf8f7', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '12px 16px' }}>Timestamp</th>
                      <th style={{ padding: '12px 16px' }}>Action</th>
                      <th style={{ padding: '12px 16px' }}>Admin / Operator</th>
                      <th style={{ padding: '12px 16px' }}>Target Account</th>
                      <th style={{ padding: '12px 16px' }}>Details / Reason</th>
                      <th style={{ padding: '12px 16px' }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log._id || log.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--red)', fontSize: '11px', background: '#fff0f2', padding: '3px 8px', borderRadius: '4px' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {log.adminEmail || log.userId?.email || 'System'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {log.targetUserEmail || (log.targetUserId?.email ?? '—')}
                        </td>
                        <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                          {log.details || log.reason || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No audit log events recorded yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SUPPORT TICKETS */}
      {activeTab === 'support' && (
        <div>
          <div className="section-head">
            <div>
              <span className="eyebrow">HELP DESK</span>
              <h2>Provider & Customer Inquiries ({supportTickets.length})</h2>
            </div>
          </div>

          {supportTickets.length ? (
            <div className="enquiry-list">
              {supportTickets.map(t => (
                <article className="enquiry-card" key={t._id}>
                  <div>
                    <span className="eyebrow">{t.category} · STATUS: {t.status}</span>
                    <h3>{t.subject}</h3>
                    <p>{t.message}</p>
                    <small>User: {t.userId?.name || 'Account User'} ({t.userId?.email || ''})</small>
                  </div>
                  <div className="provider-actions">
                    <select
                      value={t.status}
                      onChange={e => updateTicketStatus(t._id, e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--line)', background: '#fff' }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No support requests submitted.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: DOCUMENT VIEWER */}
      {documentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{documentModal.title}</h3>
              <button
                type="button"
                className="btn btn-small btn-outline"
                onClick={() => setDocumentModal(null)}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ minHeight: '300px', display: 'grid', placeItems: 'center', background: '#f8f8f8', borderRadius: '12px', overflow: 'hidden' }}>
              <iframe
                src={documentModal.url}
                title="Document viewer"
                style={{ width: '100%', height: '450px', border: 'none' }}
              />
            </div>
            <p className="muted tiny" style={{ marginTop: '12px' }}>
              🔒 Document delivered through authorized administrator stream. Confidential record for verification only.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: REJECTION REASON */}
      {rejectionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '500px', width: '100%' }}>
            <span className="eyebrow" style={{ color: 'var(--red)' }}>APPLICATION DECISION</span>
            <h3 style={{ margin: '8px 0' }}>Reject or Request Fix: {rejectionModal.fullName}</h3>
            <p className="muted" style={{ fontSize: '13px' }}>
              Please specify the rejection or resubmission reason. The user will be notified in their portal to upload corrected documents.
            </p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Driving licence photo was blurry. Please upload a clear colour scan."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', margin: '12px 0' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setRejectionModal(null)}>Cancel</button>
              <button
                className="btn"
                onClick={() => decide(rejectionModal.id || rejectionModal._id, 'reject', rejectionReason)}
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUSPENSION REASON */}
      {suspendModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '500px', width: '100%' }}>
            <span className="eyebrow" style={{ color: 'var(--red)' }}>ACCOUNT SUSPENSION</span>
            <h3 style={{ margin: '8px 0' }}>Suspend Account: {suspendModal.name}</h3>
            <p className="muted" style={{ fontSize: '13px' }}>
              Suspended accounts are immediately blocked from logging in or booking on NUK RentServe.
            </p>
            <textarea
              rows={3}
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              placeholder="State reason for suspension (will be logged in audit trail)..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', margin: '12px 0' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setSuspendModal(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={() => handleSuspend(suspendModal, 'suspend', suspendReason)}
              >
                Confirm Account Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
