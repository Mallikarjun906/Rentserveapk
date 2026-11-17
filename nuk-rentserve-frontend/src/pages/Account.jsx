import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, clearSession, readUser, unwrapItems } from '../services/api';
export function Dashboard() {
  const [currentUser, setCurrentUser] = useState(readUser());
  const [data, setData] = useState([]);
  const [propertyBookings, setPropertyBookings] = useState([]);
  const [transportBookings, setTransportBookings] = useState([]);
  const [error, setError] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email?.startsWith('phone_') ? '' : (currentUser?.email || ''),
    city: currentUser?.location || 'Bagalkot'
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    Promise.allSettled([
      api('enquiries/my'),
      api('bookings/mine'),
      api('transport-bookings/mine')
    ]).then(results => {
      if (results[0].status === 'fulfilled') setData(unwrapItems(results[0].value));
      if (results[1].status === 'fulfilled') setPropertyBookings(unwrapItems(results[1].value));
      if (results[2].status === 'fulfilled') setTransportBookings(unwrapItems(results[2].value));
      const fail = results.find(r => r.status === 'rejected');
      if (fail) setError(fail.reason?.message || 'Some account data could not be loaded.');
    });
  }, []);

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileErr('');
    setProfileMsg('');
    try {
      const updated = await api('auth/customer/profile', {
        method: 'PUT',
        body: {
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          city: profileForm.city.trim()
        }
      });
      const mergedUser = { ...currentUser, ...updated, profileCompleted: true };
      sessionStorage.setItem('nuk_user', JSON.stringify(mergedUser));
      setCurrentUser(mergedUser);
      setProfileMsg('Profile details updated successfully.');
      setEditingProfile(false);
    } catch (err) {
      setProfileErr(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  const isCustomer = currentUser?.role === 'customer' || !currentUser?.role;
  const isProfileIncomplete = isCustomer && (!currentUser?.profileCompleted || currentUser?.email?.startsWith('phone_'));

  return (
    <section className="wrap section">
      <span className="eyebrow">YOUR WORKSPACE</span>
      <h1>Hello, {currentUser?.name || 'there'}.</h1>
      <p className="muted">Manage your account, property requests and enquiries.</p>

      {/* Profile Completion Alert for Customers */}
      {isProfileIncomplete && !editingProfile && (
        <div
          style={{
            background: '#fffbeb',
            border: '1.5px solid #f59e0b',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <strong style={{ color: '#92400e', fontSize: '15px' }}>
              Complete Your Customer Profile
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#b45309' }}>
              Your mobile is verified! Add your email address and name to complete your profile.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setEditingProfile(true)}
            style={{ borderColor: '#d97706', color: '#b45309' }}
          >
            Update Profile Details
          </button>
        </div>
      )}

      {profileMsg && <div className="notice success" role="status" style={{ marginBottom: '20px' }}>{profileMsg}</div>}
      {profileErr && <div className="notice error" role="alert" style={{ marginBottom: '20px' }}>{profileErr}</div>}

      {/* Inline Profile Editor Form */}
      {editingProfile && (
        <form
          onSubmit={handleProfileUpdate}
          className="form-stack"
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '28px',
            maxWidth: '640px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Update Customer Profile</h3>
            <button
              type="button"
              onClick={() => { setEditingProfile(false); setProfileErr(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '13px' }}
            >
              Cancel ✕
            </button>
          </div>

          <label>
            Full Name
            <input
              required
              minLength={2}
              maxLength={100}
              value={profileForm.name}
              onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
              placeholder="e.g. Ramesh Patil"
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              required
              value={profileForm.email}
              onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
              placeholder="e.g. ramesh@example.com"
            />
          </label>

          <label>
            City / Location
            <input
              value={profileForm.city}
              onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
              placeholder="e.g. Bagalkot, Karnataka"
            />
          </label>

          <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px', color: 'var(--muted)' }}>
            Verified Mobile: <b>+91 {currentUser?.phoneNumber || currentUser?.phone || '—'}</b> (Phone number cannot be changed here).
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button className="btn" disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setEditingProfile(false); setProfileErr(''); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Dashboard Summary Cards */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <span className="eyebrow">ACCOUNT PROFILE</span>
          <h2>{currentUser?.role || 'Customer'}</h2>
          <p style={{ margin: '4px 0 2px' }}><b>{currentUser?.name}</b></p>
          <small className="muted" style={{ display: 'block', marginBottom: '8px' }}>
            {currentUser?.email?.startsWith('phone_') ? 'Mobile account' : currentUser?.email}
          </small>
          {currentUser?.phone && (
            <small style={{ display: 'block', color: '#166534', fontWeight: 600 }}>
              +91 {currentUser.phone} (Verified ✓)
            </small>
          )}
          {isCustomer && !editingProfile && (
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              style={{
                marginTop: '10px',
                background: 'none',
                border: 'none',
                color: 'var(--red)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Edit profile details →
            </button>
          )}
        </div>
        <div className="dashboard-card">
          <span className="eyebrow">ENQUIRIES</span>
          <h2>{data.length}</h2>
          <p>Requests linked to your account.</p>
          <Link to="/enquiries" className="text-link">Open enquiries →</Link>
        </div>
        <div className="dashboard-card">
          <span className="eyebrow">PROPERTY BOOKINGS</span>
          <h2>{propertyBookings.length}</h2>
          <p>Your rental booking requests.</p>
          <Link to="/rentals" className="text-link">Browse rentals →</Link>
        </div>
      </div>

      {error && <div className="notice">Some account data could not be loaded: {error}</div>}

      <div className="section-head" style={{ marginTop: '36px' }}>
        <div>
          <span className="eyebrow">TRANSPORT</span>
          <h2>My transport requests ({transportBookings.length})</h2>
        </div>
        <Link to="/transport" className="btn btn-outline">Find transport</Link>
      </div>

      {transportBookings.length ? (
        <div className="enquiry-list">
          {transportBookings.map(b => (
            <article className="enquiry-card" key={b._id}>
              <div>
                <span className="eyebrow">{b.vehicleType} · {b.status}</span>
                <h3>{b.pickup} → {b.destination}</h3>
                <p>{new Date(b.scheduledAt).toLocaleString()}</p>
                <small>{b.providerId?.name ? `Provider: ${b.providerId.name}` : 'Waiting for an approved provider'}</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Your transport requests will appear here after you submit one.</p>
        </div>
      )}

      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
        <button
          className="btn btn-outline"
          onClick={() => {
            clearSession();
            nav('/login');
          }}
        >
          Sign out
        </button>
      </div>
    </section>
  );
}
export function Enquiries(){const [items,setItems]=useState([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);useEffect(()=>{api('enquiries/my').then(d=>setItems(unwrapItems(d))).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);return <section className="wrap section"><span className="eyebrow">YOUR REQUESTS</span><h1>Enquiries & work chat</h1><p className="muted">Keep messages connected to the work they belong to.</p>{loading?<p>Loading enquiries…</p>:error?<div className="notice error">{error}</div>:items.length?<div className="enquiry-list">{items.map(i=><article className="enquiry-card" key={i._id||i.id}><div><span className="eyebrow">{i.listingType||'ENQUIRY'} · {i.contactStatus||'pending'}</span><h3>{i.listingTitle||i.title||'Enquiry'}</h3><p>{i.message}</p><small>Created {i.createdAt?new Date(i.createdAt).toLocaleString():'recently'}</small></div></article>)}</div>:<div className="empty-state"><h3>No enquiries yet</h3><p>When you submit a request, it will appear here.</p><Link className="btn" to="/transport">Find transport</Link></div>}</section>}
export function Admin(){
 const [applications,setApplications]=useState([]); const [tickets,setTickets]=useState([]); const [users,setUsers]=useState([]); const [stats,setStats]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [notice,setNotice]=useState(''); const [busyId,setBusyId]=useState('');
 async function load(){setLoading(true);setError('');const results=await Promise.allSettled([api('admin/provider-applications'),api('support'),api('admin/stats'),api('admin/users',{query:{limit:50}})]);if(results[0].status==='fulfilled')setApplications(unwrapItems(results[0].value));if(results[1].status==='fulfilled')setTickets(unwrapItems(results[1].value));if(results[2].status==='fulfilled')setStats(results[2].value);if(results[3].status==='fulfilled')setUsers(unwrapItems(results[3].value?.users || results[3].value));const failure=results.find(r=>r.status==='rejected');if(failure)setError(failure.reason?.message||'Some admin data could not be loaded.');setLoading(false);}
 useEffect(()=>{load();},[]);
 async function decide(id,decision){setBusyId(id);setNotice('');try{await api(`admin/provider-applications/${id}`,{method:'PATCH',body:{decision,note:''}});setNotice(`Provider application ${decision==='approve'?'approved':decision==='reject'?'rejected':'updated'}.`);await load();}catch(e){setNotice(e.message);}finally{setBusyId('');}}
 async function identityReview(item,status){const note=status==='match'?'Identity details reviewed and matched by admin.':status==='possible_mismatch'?'Identity details require clarification.':'Manual review required.';try{await api(`admin/provider-applications/${item.id}/identity-review`,{method:'PATCH',body:{status,aadhaarName:item.aadhaarName||item.name,note}});setNotice('Identity review status saved.');await load();}catch(e){setNotice(e.message);}}
 async function updateTicket(id,status){try{await api(`support/${id}/status`,{method:'PATCH',body:{status}});setNotice('Support request updated.');await load();}catch(e){setNotice(e.message);}}
 async function setUserActive(id,isActive){try{await api(`admin/users/${id}/status`,{method:'PATCH',body:{isActive}});setNotice('User status updated.');await load();}catch(e){setNotice(e.message);}}
 return <section className="wrap section"><span className="eyebrow">ADMINISTRATION</span><h1>Admin dashboard</h1><p className="muted">Live data from the connected backend. Only authorized administrator accounts can access these records.</p>{error&&<div className="notice error">{error}</div>}{notice&&<div className="notice" role="status">{notice}</div>}{loading?<p>Loading admin data…</p>:<>
 <div className="dashboard-grid"><div className="dashboard-card"><span className="eyebrow">USERS</span><h2>{stats?.users??'—'}</h2></div><div className="dashboard-card"><span className="eyebrow">SERVICE LISTINGS</span><h2>{stats?.services??'—'}</h2></div><div className="dashboard-card"><span className="eyebrow">PROPERTY LISTINGS</span><h2>{stats?.properties??'—'}</h2></div></div>
 <div className="section-head"><div><span className="eyebrow">USER MANAGEMENT</span><h2>Users ({users.length})</h2><p className="muted">Recent user accounts from the database.</p></div></div>
 {users.length?<div className="enquiry-list">{users.map(u=><article className="enquiry-card" key={u._id||u.id}><div><span className="eyebrow">{u.role} · {u.isActive===false?'inactive':'active'}</span><h3>{u.name}</h3><p>{u.email}</p><small>{u.phone||'No phone'} · {u.location||'No location'}</small></div><button className="btn btn-outline" disabled={u._id===readUser()?.id||u.id===readUser()?.id} onClick={()=>setUserActive(u._id||u.id,u.isActive===false)}>{u.isActive===false?'Reactivate':'Deactivate'}</button></article>)}</div>:<div className="empty-state"><p>No user records returned by the API.</p></div>}
 <div className="section-head"><div><span className="eyebrow">PROVIDER ONBOARDING</span><h2>Provider applications ({applications.length})</h2><p className="muted">Approve or reject applications after reviewing submitted details and any identity documents.</p></div><button className="btn btn-outline" onClick={load}>Refresh</button></div>
 {applications.length?<div className="enquiry-list">{applications.map(item=><article className="enquiry-card" key={item.id}><div><span className="eyebrow">{item.category} · {item.status}</span><h3>{item.name}</h3><p>{item.description}</p><small>{item.email} · {item.phone} · {item.city}, {item.taluk}, {item.district}</small><p>Identity document: {item.aadhaarDocumentAvailable?'uploaded':'not supplied'} · review: {item.identityReviewStatus||'not_checked'}</p>{item.reviewNote&&<p>Review note: {item.reviewNote}</p>}{item.aadhaarDocumentAvailable&&<div className="provider-actions"><label>Identity review<select defaultValue={item.identityReviewStatus||'not_checked'} onChange={e=>identityReview(item,e.target.value)}><option value="not_checked">Not checked</option><option value="match">Reviewed and matched</option><option value="possible_mismatch">Possible mismatch</option><option value="manual_review_required">Manual review required</option></select></label></div>}</div><div className="provider-actions"><button className="btn" disabled={busyId===item.id||item.status==='approved'} onClick={()=>decide(item.id,'approve')}>{busyId===item.id?'Saving…':'Approve'}</button><button className="btn btn-outline" disabled={busyId===item.id||item.status==='rejected'} onClick={()=>decide(item.id,'reject')}>Reject</button><button className="btn btn-outline" disabled={busyId===item.id} onClick={()=>decide(item.id,'info')}>Request info</button></div></article>)}</div>:<div className="empty-state"><h3>No pending provider applications</h3><p>New provider registrations will appear here when submitted to the backend.</p></div>}
 <div className="section-head" style={{marginTop:'48px'}}><div><span className="eyebrow">PROVIDER HELP DESK</span><h2>Support requests ({tickets.length})</h2></div></div>
 {tickets.length?<div className="enquiry-list">{tickets.map(t=><article className="enquiry-card" key={t._id}><div><span className="eyebrow">{t.category} · {t.status}</span><h3>{t.subject}</h3><p>{t.message}</p><small>{t.userId?.name||'User'} · {t.userId?.email||''}</small></div><div className="provider-actions"><select aria-label="Support ticket status" value={t.status} onChange={e=>updateTicket(t._id,e.target.value)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div></article>)}</div>:<div className="empty-state"><p>No support requests have been submitted.</p></div>}
 </>}</section>
}
