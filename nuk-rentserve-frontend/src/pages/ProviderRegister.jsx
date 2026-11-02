import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveSession } from '../services/api';

const initial = { fullName:'', dob:'', phone:'', email:'', password:'', address:'', serviceArea:'', city:'', taluk:'', district:'', category:'', experience:'', price:'', description:'', terms:false, consent:false };
const driverCategories = ['Auto', 'Passenger car', 'Goods van'];
export default function ProviderRegister() {
 const [form,setForm] = useState(initial);
 const [document,setDocument] = useState(null);
 const [profileImage,setProfileImage] = useState(null);
 const [vehicleImages,setVehicleImages] = useState([]);
 const [error,setError] = useState(''); const [message,setMessage] = useState(''); const [busy,setBusy] = useState(false); const navigate = useNavigate();
 const update = (key,value) => setForm(old => ({...old,[key]:value}));
 async function submit(e) {
  e.preventDefault(); setError(''); setMessage('');
  if (!profileImage) { setError('Please upload your provider profile photo.'); return; }
  if (driverCategories.includes(form.category) && vehicleImages.length === 0) { setError('Driver applications must include at least one vehicle photo.'); return; }
  if (vehicleImages.length > 5) { setError('Upload no more than five vehicle photos.'); return; }
  setBusy(true);
  try {
   const body = new FormData();
   Object.entries(form).forEach(([key,value]) => body.append(key, String(value)));
   body.append('profileImage', profileImage);
   vehicleImages.forEach(file => body.append('vehicleImages', file));
   if (document) body.append('aadhaarDocument', document);
   const result = await api('providers/register', {method:'POST', body});
   saveSession(result);
   setMessage('ನಿಮ್ಮ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ. ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳ್ಳುವವರೆಗೆ ಕಾಯಿರಿ. / Your application has been submitted for review.');
   setTimeout(() => navigate('/dashboard', {replace:true}), 1500);
  } catch (err) { setError(err.message || 'Registration failed. Please check your details and try again.'); }
  finally { setBusy(false); }
 }
 return <section className="auth-simple provider-register-page"><div className="auth-panel provider-register-panel">
  <span className="eyebrow">ನಮ್ಮ ಸ್ಥಳೀಯ ಜಾಲಕ್ಕೆ ಸೇರಿ · JOIN OUR LOCAL NETWORK</span><h1>Become a provider</h1>
  <p className="muted">Local professionals and transport providers can register from any city, taluk or district in Karnataka. Property owners should create a Property owner account from customer registration. Applications are reviewed before eligible listings go live.</p>
  <form className="form-stack" onSubmit={submit}>
   <h3>Account details</h3>
   <label>Full name<input required minLength="3" maxLength="100" autoComplete="name" value={form.fullName} onChange={e=>update('fullName',e.target.value)} /></label>
   <div className="form-two"><label>Date of birth<input type="date" required max={new Date().toISOString().slice(0,10)} value={form.dob} onChange={e=>update('dob',e.target.value)} /></label><label>Phone number<input required inputMode="numeric" autoComplete="tel" pattern="[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" value={form.phone} onChange={e=>update('phone',e.target.value)} /></label></div>
   <label>Email address<input type="email" required autoComplete="email" value={form.email} onChange={e=>update('email',e.target.value)} /></label>
   <label>Password<input type="password" required minLength="8" maxLength="72" autoComplete="new-password" value={form.password} onChange={e=>update('password',e.target.value)} /><small>Use at least 8 characters.</small></label>
   <h3>Location and provider details</h3>
   <div className="form-two"><label>City / town<input required maxLength="100" placeholder="Write any city or town" value={form.city} onChange={e=>update('city',e.target.value)} /></label><label>Taluk / ತಾಲೂಕು<input required maxLength="100" placeholder="Write your taluk" value={form.taluk} onChange={e=>update('taluk',e.target.value)} /></label></div>
   <div className="form-two"><label>District / ಜಿಲ್ಲೆ<input required maxLength="100" placeholder="Write your district" value={form.district} onChange={e=>update('district',e.target.value)} /></label><label>Provider category<select required value={form.category} onChange={e=>{update('category',e.target.value);setVehicleImages([]);}}><option value="">Choose category</option><option value="Carpenter">Carpenter</option><option value="Plumber">Plumber</option><option value="Electrician">Electrician</option><option value="Painter">Painter</option><option value="Cleaning">Cleaning</option><option value="Appliance Repair">Appliance Repair</option><option value="Other Services">Other local service</option><option value="Auto">Auto / driver</option><option value="Passenger car">Passenger car / driver</option><option value="Goods van">Goods van / driver</option><option value="Other">Other</option></select></label></div>
   <label>Full address<textarea required minLength="8" maxLength="300" rows="2" autoComplete="street-address" value={form.address} onChange={e=>update('address',e.target.value)} /></label>
   <label>Service area / localities covered<input required minLength="2" maxLength="200" placeholder="City, taluk, nearby towns or villages" value={form.serviceArea} onChange={e=>update('serviceArea',e.target.value)} /></label>
   <div className="form-two"><label>Experience<input required maxLength="80" placeholder="e.g. 3 years" value={form.experience} onChange={e=>update('experience',e.target.value)} /></label><label>Starting price (optional)<input maxLength="100" value={form.price} onChange={e=>update('price',e.target.value)} placeholder="e.g. ₹500" /></label></div>
   <label>Describe your service or listing<textarea required minLength="10" maxLength="3000" rows="4" value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Tell customers what you offer" /></label>
   <h3>Required photos / ಅಗತ್ಯ ಚಿತ್ರಗಳು</h3><p className="muted">A profile photo is mandatory for every provider. Drivers must also upload at least one clear photo of the vehicle.</p>
   <label>Provider profile photo * (JPG or PNG, max 5 MB)<input type="file" accept="image/jpeg,image/png" required onChange={e=>setProfileImage(e.target.files?.[0] || null)} /></label>{profileImage && <small>Selected profile photo: {profileImage.name}</small>}
   {driverCategories.includes(form.category) && <label>Vehicle photos * (1–5 JPG or PNG images, max 5 MB each)<input type="file" accept="image/jpeg,image/png" multiple required onChange={e=>setVehicleImages(Array.from(e.target.files || []).slice(0,5))} /><small>{vehicleImages.length ? `${vehicleImages.length} vehicle photo(s) selected` : 'Driver applications require vehicle photos.'}</small></label>}
   <label>Identity document (optional; JPG, PNG or PDF, max 5 MB)<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e=>setDocument(e.target.files?.[0] || null)} /></label>
   {document && <label className="checkbox-label"><input type="checkbox" checked={form.consent} onChange={e=>update('consent',e.target.checked)} /> I consent to secure processing of the identity document for provider review.</label>}
   <label className="checkbox-label"><input type="checkbox" required checked={form.terms} onChange={e=>update('terms',e.target.checked)} /> I confirm my details are accurate and accept the terms of service.</label>
   {error && <div className="notice error" role="alert">{error}</div>}{message && <div className="notice success" role="status">{message}</div>}
   <button className="btn btn-full" disabled={busy}>{busy ? 'Submitting application…' : 'Submit provider application'}</button>
   <p className="form-note">Already registered as a provider? <Link to="/login">Log in</Link></p><p className="form-note">Looking for a customer account? <Link to="/register">Customer registration</Link></p>
  </form>
 </div></section>;
}
