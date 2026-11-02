import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { api, unwrapItems } from '../services/api';
export function Directory({kind}){const property=kind==='property';const [searchParams]=useSearchParams();const [items,setItems]=useState([]);const [busy,setBusy]=useState(true);const [error,setError]=useState('');const [filters,setFilters]=useState(()=>({q:searchParams.get('q')||'',city:searchParams.get('location')||'',type:searchParams.get('type')||'',category:searchParams.get('category')||''}));const endpoint=property?'properties':'services';async function load(e){e?.preventDefault();setBusy(true);setError('');try{const q={limit:50};if(filters.q)q.search=filters.q;if(filters.city)q.location=filters.city;if(property&&filters.type)q.type=filters.type;if(!property&&filters.category)q.category=filters.category;const data=await api(endpoint,{query:q});const rows=unwrapItems(data);
   const needle=filters.q.trim().toLowerCase();
   const categoryNeedle=filters.category.trim().toLowerCase();
   setItems(rows.filter(item=>{
    const haystack=[item.title,item.name,item.description,item.location,item.address,item.type,item.category?.name,item.category].filter(Boolean).join(' ').toLowerCase();
    return (!needle||haystack.includes(needle))&&(!categoryNeedle||String(item.category?.name||item.category||'').toLowerCase().includes(categoryNeedle));
   }));}catch(err){setError(err.message);}finally{setBusy(false);}}useEffect(()=>{load();},[]);return <section className="wrap section directory"><div className="section-heading"><div><span className="eyebrow">NUK RENTSERVE DIRECTORY</span><h1>{property?'Find a place to call home':'Find local services'}</h1><p className="muted">{property?'Browse published rentals across Karnataka.':'Explore providers and services near your location.'}</p></div><Link to="/register" className="btn btn-small">Join as provider</Link></div><form className="search-panel" onSubmit={load}><label>Search<input placeholder={property?'Title, locality or keyword':'Service or provider'} value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/></label><label>City / locality<input placeholder="Any Karnataka location" value={filters.city} onChange={e=>setFilters({...filters,city:e.target.value})}/></label>{property?<label>Property type<select value={filters.type} onChange={e=>setFilters({...filters,type:e.target.value})}><option value="">All types</option><option value="house">House</option><option value="shop">Shop</option><option value="room">Room</option><option value="PG">PG</option></select></label>:<label>Category<input placeholder="e.g. Carpenter" value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})}/></label>}<button className="btn">Search</button></form>{error&&<div className="notice error">{error}</div>}{busy?<div className="empty-state">Loading listings…</div>:items.length?<div className="listing-grid">{items.map((item)=><ListingCard key={item.id||item._id} item={item} kind={kind}/>)}</div>:<div className="empty-state"><span>⌕</span><h3>No listings found</h3><p>Try another search or check again later. Listings are loaded from the connected backend.</p></div>}</section>}
export function Detail({kind}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [enquiry, setEnquiry] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingNotice, setBookingNotice] = useState('');
  const [bookingBusy, setBookingBusy] = useState(false);
  const property = kind === 'property';
  const supported = kind === 'property' || kind === 'service';
  const endpoint = property ? 'properties' : 'services';

  useEffect(() => {
    if (!supported) {
      setBusy(false);
      setError('Transport listing details are not supported by the currently deployed backend.');
      return undefined;
    }
    let active = true;
    setBusy(true);
    api(`${endpoint}/${id}`)
      .then(data => { if (active) setItem(data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [endpoint, id, supported]);

  async function sendEnquiry(e) {
    e.preventDefault();
    setMessage('');
    if (!sessionStorage.getItem('nuk_access_token')) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setSending(true);
    try {
      await api('enquiries', { method: 'POST', body: { listingId: id, listingType: kind, message: enquiry.trim() } });
      setMessage('Your enquiry was sent successfully. You can follow its status from Enquiries & Chat.');
      setEnquiry('');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSending(false);
    }
  }

  async function requestPropertyBooking(e) {
    e.preventDefault(); setBookingNotice('');
    const user = JSON.parse(sessionStorage.getItem('nuk_user') || 'null');
    if (!sessionStorage.getItem('nuk_access_token')) { navigate('/login', { state: { from: window.location.pathname } }); return; }
    if (!['customer','owner'].includes(user?.role)) { setBookingNotice('Please sign in with a customer account to request a property booking.'); return; }
    setBookingBusy(true);
    try {
      const result = await api('bookings', { method:'POST', body:{ propertyId:id, requestedMoveInDate:moveInDate || undefined, message:bookingMessage.trim() } });
      setBookingNotice(result?.message || 'Booking request sent to the property owner.'); setBookingMessage('');
    } catch (err) { setBookingNotice(err.message); }
    finally { setBookingBusy(false); }
  }

  if (busy) return <section className="wrap section"><p>Loading listing details…</p></section>;
  if (error || !item) {
    return <section className="wrap section">
      <div className="notice error">{error || 'This listing could not be found.'}</div>
      <Link to={property ? '/rentals' : kind === 'service' ? '/services' : '/transport'} className="text-link">← Back to listings</Link>
    </section>;
  }

  const title = item.title || item.name || item.displayName || 'Listing';
  const image = item.images?.[0]?.url || item.images?.[0] || item.image || '';
  const location = item.location || item.city || item.address || 'Karnataka';
  let price = 'Contact for price';
  if (item.rent != null) price = `₹${item.rent}${item.rentPeriod ? ` / ${item.rentPeriod}` : ' / month'}`;
  else if (item.priceRange?.min != null && (item.priceRange.min > 0 || item.priceRange.max > 0)) {
    price = `₹${item.priceRange.min}${item.priceRange.max && item.priceRange.max !== item.priceRange.min ? `–₹${item.priceRange.max}` : ''}`;
  } else if (item.price) price = item.price;

  return <section className="wrap section detail-page">
    <Link to={property ? '/rentals' : '/services'} className="text-link">← Back to listings</Link>
    <div className="detail-layout">
      <article className="detail-content">
        {image ? <img className="detail-image" src={image} alt={title} /> : <div className="detail-image detail-image-placeholder">{property ? '⌂' : '✦'}</div>}
        <span className="eyebrow">{property ? (item.type || 'RENTAL') : (item.categoryId?.name || item.category?.name || 'LOCAL SERVICE')}</span>
        <h1>{title}</h1>
        <p className="detail-location">⌖ {location}</p>
        <h2>About this {property ? 'property' : 'service'}</h2>
        <p className="detail-description">{item.description || 'Contact the listing owner for more information.'}</p>
        {item.address && <p><strong>Address:</strong> {item.address}</p>}
        {Array.isArray(item.facilities) && item.facilities.length > 0 && <>
          <h3>Facilities</h3>
          <ul>{item.facilities.map(facility => <li key={String(facility)}>{String(facility)}</li>)}</ul>
        </>}
      </article>
      <aside className="detail-enquiry-card">
        <span className="eyebrow">LISTING DETAILS</span>
        <strong className="detail-price">{price}</strong>
        <p className="muted">Send a message to the listing owner or provider. Keep communication connected to this listing.</p>
        <form className="form-stack" onSubmit={sendEnquiry}>
          <label>Your enquiry
            <textarea required minLength={5} maxLength={2000} rows={5} value={enquiry} onChange={e => setEnquiry(e.target.value)} placeholder="Ask about availability, price or details…" />
          </label>
          {message && <div className={message.includes('successfully') ? 'notice success' : 'notice'} role="status">{message}</div>}
          <button className="btn btn-full" disabled={sending}>{sending ? 'Sending…' : 'Send enquiry'}</button>
        </form>
        <p className="muted tiny">You may need to log in before sending an enquiry.</p>
        {property && <div className="property-booking-block"><h3>Request a property booking</h3><form className="form-stack" onSubmit={requestPropertyBooking}><label>Requested move-in date<input type="date" min={new Date().toISOString().slice(0,10)} value={moveInDate} onChange={e=>setMoveInDate(e.target.value)} /></label><label>Message to owner<textarea rows={3} maxLength={1500} value={bookingMessage} onChange={e=>setBookingMessage(e.target.value)} placeholder="Tell the owner when you plan to move in." /></label>{bookingNotice && <div className="notice" role="status">{bookingNotice}</div>}<button className="btn btn-full" disabled={bookingBusy}>{bookingBusy?'Sending request…':'Request booking'}</button></form></div>}
      </aside>
    </div>
  </section>;
}
