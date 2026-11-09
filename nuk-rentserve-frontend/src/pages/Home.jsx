import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, unwrapItems } from '../services/api';

const photos = {
  home: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1100&q=85',
  heritage: '/assets/images/hampi-karnataka.webp',
  apartment: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85',
  service: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=85',
  auto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=85',
  car: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85',
  van: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=85',
};
const categories = [
  { n: '01', title: 'Find a place', desc: 'Homes, rooms, PGs and commercial spaces.', to: '/rentals', photo: photos.home, label: 'RENTALS' },
  { n: '02', title: 'Get it done', desc: 'Connect with local professionals for everyday needs.', to: '/services', photo: photos.service, label: 'LOCAL SERVICES' },
  { n: '03', title: 'Get moving', desc: 'Find autos, passenger cars and goods vehicles.', to: '/transport', photo: photos.car, label: 'TRANSPORT' },
];
const places = ['ಬೆಂಗಳೂರು','ಮೈಸೂರು','ಬೆಳಗಾವಿ','ಹುಬ್ಬಳ್ಳಿ–ಧಾರವಾಡ','ಬಾಗಲಕೋಟೆ','ವಿಜಯಪುರ','ಮಂಗಳೂರು','ಕಲಬುರಗಿ'];
export default function Home() {
  const [kind, setKind] = useState('rentals');
  const [location, setLocation] = useState('');
  const [query, setQuery] = useState('');
  const [featuredProviders, setFeaturedProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState('');
  useEffect(() => {
    let active = true;
    api('services', { query: { limit: 6, status: 'published' } })
      .then(data => { if (active) setFeaturedProviders(unwrapItems(data).slice(0, 6)); })
      .catch(error => { if (active) setProvidersError(error.message); })
      .finally(() => { if (active) setProvidersLoading(false); });
    return () => { active = false; };
  }, []);
  const quickServices = [
    { icon: '⌂', title: 'Home services', desc: 'Everyday help at home', q: 'home' },
    { icon: '⌁', title: 'Repairs & maintenance', desc: 'Find local professionals', q: 'repair' },
    { icon: '✦', title: 'Cleaning', desc: 'Keep your space fresh', q: 'cleaning' },
    { icon: '◆', title: 'Carpentry', desc: 'Furniture and woodwork', q: 'carpenter' },
    { icon: 'ϟ', title: 'Electrical work', desc: 'Electrical service providers', q: 'electrician' },
    { icon: '◉', title: 'Plumbing', desc: 'Water and plumbing needs', q: 'plumber' },
  ];
  const destination = kind === 'rentals' ? '/rentals' : kind === 'services' ? '/services' : '/transport';
  return <>
    <section className="home-hero">
      <img className="hero-photo" src={photos.heritage} alt="Hampi temple architecture at sunset in Karnataka" fetchPriority="high" />
      <div className="hero-shade" />
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="hero-kicker"><span className="live-dot"/> ಕರ್ನಾಟಕದ ಜನರಿಗಾಗಿ · MADE FOR KARNATAKA</span>
          <h1>ನಿಮ್ಮ ಊರು.<br/><span>Your people.</span></h1>
          <p>Find a home, connect with a trusted local professional, or arrange transport — all in one place built around Karnataka.</p>
          <div className="hero-quicklinks"><Link to="/rentals">Explore rentals <span>↗</span></Link><Link to="/services">Find local services <span>↗</span></Link></div>
        </div>
        <div className="hero-visual" aria-label="Rental home in Karnataka">
          <img src={photos.home} alt="Bright modern home available for rental" fetchPriority="high" />
          <div className="hero-visual-caption"><span className="hero-visual-pin">⌖</span><span><b>Local finds, closer to home</b><small>Homes · Services · Transport</small></span></div>
          <span className="hero-visual-stamp">ನಿಮ್ಮ ಊರು, ನಿಮ್ಮ ಸೇವೆ</span>
        </div>
        <div className="hero-search-card">
          <div className="search-card-heading"><span>ನಿಮ್ಮ ಹುಡುಕಾಟ ಆರಂಭಿಸಿ</span><small>Homes, services and transport near you.</small></div>
          <div className="search-tabs" role="tablist" aria-label="Search category">
            {[['rentals','Rentals'],['services','Services'],['transport','Transport']].map(([v,label])=><button key={v} type="button" role="tab" aria-selected={kind===v} className={kind===v?'selected':''} onClick={()=>setKind(v)}>{label}</button>)}
          </div>
          <form className="hero-search-form" onSubmit={e=>{e.preventDefault();window.location.href=`${destination}?location=${encodeURIComponent(location)}&q=${encodeURIComponent(query)}`;}}>
            <label><span>Where?</span><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Any city, taluk, district or locality"/></label>
            <label><span>{kind==='rentals'?'What kind of place?':kind==='services'?'What do you need?':'What are you looking for?'}</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={kind==='rentals'?'Home, room, PG…':kind==='services'?'Cleaning, repairs…':'Auto, car, goods van…'}/></label>
            <button className="btn search-submit" type="submit">Search <span>↗</span></button>
          </form>
          <p className="search-footnote"><span>⌖</span> ಕರ್ನಾಟಕದ ಯಾವುದೇ ನಗರ, ತಾಲೂಕು ಅಥವಾ ಜಿಲ್ಲೆ</p>
        </div>
        <div className="hero-note"><span className="hero-note-number">01</span><span>LOCAL DISCOVERY<br/><b>Made a little simpler.</b></span></div>
      </div>
    </section>

    <section className="wrap trust-strip" aria-label="Platform highlights"><div><span className="trust-symbol">⌖</span><span><b>Made for Karnataka</b><small>Local discovery, statewide</small></span></div><div><span className="trust-symbol">↗</span><span><b>Direct enquiries</b><small>Connect about the work</small></span></div><div><span className="trust-symbol">✓</span><span><b>Reviewed transport listings</b><small>Approval required for eligible listings</small></span></div></section>

    <section className="wrap section discover-section"><div className="section-heading"><div><span className="eyebrow">ನಿಮಗೆ ಬೇಕಾದದ್ದು ಇಲ್ಲಿಂದ ಶುರು</span><h2>What brings you <em>here today?</em></h2></div><p>Everyday needs, all in one place. Choose a category and find your next step.</p></div>
      <div className="discovery-grid">{categories.map(c=><Link to={c.to} className="discovery-card" key={c.title}><div className="discovery-image-wrap"><img src={c.photo} alt={c.title} loading="lazy"/><span className="image-label">{c.label}</span><span className="discovery-number">{c.n}</span></div><div className="discovery-copy"><div><h3>{c.title}</h3><p>{c.desc}</p></div><span className="round-arrow">↗</span></div></Link>)}</div>
    </section>

    <section className="wrap section home-services-section">
      <div className="section-heading"><div><span className="eyebrow">LOCAL PEOPLE · REAL SERVICES</span><h2>Find the right help, <em>without the runaround.</em></h2></div><p>Explore local service categories or browse listings published by providers on NUK RentServe.</p></div>
      <div className="quick-service-grid">{quickServices.map(service => <Link key={service.q} to={`/services?q=${encodeURIComponent(service.q)}`} className="quick-service-card"><span className="quick-service-icon" aria-hidden="true">{service.icon}</span><span className="quick-service-text"><b>{service.title}</b><small>{service.desc}</small></span><span className="quick-service-arrow" aria-hidden="true">↗</span></Link>)}</div>
      <div className="provider-section-heading"><div><span className="eyebrow">PROVIDER SPOTLIGHT</span><h3>Available local listings</h3></div><Link to="/services" className="section-link">View all services <span>↗</span></Link></div>
      {providersLoading ? <div className="provider-loading" role="status">Loading published service listings…</div> : providersError ? <div className="provider-empty"><b>Service listings are temporarily unavailable.</b><p>{providersError}</p><Link to="/services" className="text-link">Open service directory ↗</Link></div> : featuredProviders.length ? <div className="home-provider-grid">{featuredProviders.map((item) => { const id = item.id || item._id; const title = item.title || item.name || item.displayName || 'Local service'; const image = item.images?.[0]?.url || item.images?.[0] || item.image || item.providerId?.profileImage || ''; const location = item.location || item.city || item.address || 'Location provided in listing'; const category = item.category?.name || item.category || 'Local service'; const provider = item.providerId?.name || item.provider?.name || item.ownerId?.name || ''; return <article className="home-provider-card" key={id}><Link to={`/services/${id}`} className="home-provider-image">{image ? <img src={image} alt={title} loading="lazy"/> : <span className="provider-image-placeholder" aria-hidden="true">✦</span>}<span className="provider-category-pill">{category}</span></Link><div className="home-provider-copy"><div className="home-provider-title-row"><h4>{title}</h4><span className="provider-live-mark" title="Published listing" aria-label="Published listing">✓</span></div>{provider && <p className="provider-name">By {provider}</p>}<p className="provider-location">⌖ {location}</p><p className="provider-description">{item.description || 'Open this listing to see details and contact the provider.'}</p><div className="home-provider-bottom"><strong>{item.priceRange?.min != null && (item.priceRange.min > 0 || item.priceRange.max > 0) ? `From ₹${item.priceRange.min}` : item.price || 'Contact for price'}</strong><Link to={`/services/${id}`} className="provider-view-link">View details ↗</Link></div></div></article>; })}</div> : <div className="provider-empty"><span className="provider-empty-icon">⌕</span><b>No published provider listings yet</b><p>When providers publish approved services, their real listings will appear here automatically.</p><Link to="/provider/register" className="btn btn-small">Join as a provider <span>↗</span></Link></div>}
    </section>

    <section className="feature-band"><div className="wrap feature-layout"><div className="feature-photo"><img src={photos.apartment} alt="Sunlit contemporary home interior" loading="lazy"/><div className="photo-caption"><span>SPACE TO CALL YOUR OWN</span><b>Find your next place.</b></div></div><div className="feature-copy"><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>Good things begin with <em>the right connection.</em></h2><p>Browse property and service listings, explore transport options, and send an enquiry when you find the right fit. Keep the conversation tied to the work, all in one place.</p><ul className="check-list"><li><span>✓</span> Explore listings by location and category</li><li><span>✓</span> Sign in to send enquiries and booking requests</li><li><span>✓</span> Track responses in your account</li></ul><Link to="/rentals" className="btn">Explore the marketplace <span>↗</span></Link></div></div></section>

    <section className="wrap section transport-preview"><div className="section-heading"><div><span className="eyebrow">GET THERE OR GET IT DELIVERED</span><h2>Transport that fits <em>the task.</em></h2></div><Link to="/transport" className="section-link">Explore transport <span>↗</span></Link></div><div className="vehicle-grid"><Link to="/transport" className="vehicle-card"><img src={photos.auto} alt="Auto rickshaw transport" loading="lazy"/><div><span>PASSENGER TRAVEL</span><h3>Autos</h3><p>For everyday local journeys.</p></div><span className="vehicle-arrow">↗</span></Link><Link to="/transport" className="vehicle-card"><img src={photos.car} alt="Passenger car" loading="lazy"/><div><span>LOCAL & OUTSTATION</span><h3>Cars</h3><p>Find a vehicle for your trip.</p></div><span className="vehicle-arrow">↗</span></Link><Link to="/transport" className="vehicle-card"><img src={photos.van} alt="Goods transport van" loading="lazy"/><div><span>GOODS & MOVING</span><h3>Goods vans</h3><p>Arrange transport for your goods.</p></div><span className="vehicle-arrow">↗</span></Link></div></section>

    <section className="locations-section"><div className="wrap locations-layout"><div><span className="eyebrow">ಕರ್ನಾಟಕದಾದ್ಯಂತ · ROOTED HERE</span><h2>Find what you need<br/>closer to <em>your corner.</em></h2><p>ಯಾವುದೇ ನಗರ, ತಾಲೂಕು ಅಥವಾ ಜಿಲ್ಲೆಯನ್ನು ಹುಡುಕಿ. Karnatakaದ ಎಲ್ಲ ಸ್ಥಳಗಳನ್ನು ಬರೆಯಬಹುದು.</p><Link to="/rentals" className="text-link">Explore listings by location ↗</Link></div><div className="location-chips">{places.map((p,i)=><Link to={`/rentals?location=${encodeURIComponent(p)}`} key={p}><span>0{i+1}</span>{p}<b>↗</b></Link>)}<Link className="location-anywhere" to="/rentals"><span>＋</span>ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಬರೆಯಿರಿ <b>↗</b></Link></div></div></section>

    <section className="wrap section provider-cta-section"><div className="provider-cta"><div className="provider-cta-content"><span className="eyebrow">FOR LOCAL PROFESSIONALS & DRIVERS</span><h2>Have a service or vehicle?<br/><em>Bring it to the community.</em></h2><p>Service providers submit their details for review and manage customer enquiries from one place. Property owners can register a separate owner account to publish rentals.</p><div className="hero-actions"><Link className="btn" to="/provider/register">Become a provider <span>↗</span></Link><Link className="btn btn-outline" to="/contact">Contact support</Link></div></div><div className="provider-visual"><img src={photos.service} alt="Professional preparing to provide a local service" loading="lazy"/><div className="provider-sticker"><b>Local work.</b><span>Real connections.</span></div></div></div></section>

    <section className="wrap faq-section section"><div className="section-heading"><div><span className="eyebrow">GOOD TO KNOW</span><h2>A few quick <em>answers.</em></h2></div><Link to="/contact" className="section-link">Need help? Contact us ↗</Link></div><div className="faq-grid"><details><summary>Can I browse without an account?</summary><p>Yes. You can browse public listings. Sign in is required to submit bookings, enquiries or private messages.</p></details><details><summary>How do transport bookings work?</summary><p>Choose an eligible vehicle, submit pickup and destination details, and wait for the provider to accept or reject your request.</p></details><details><summary>Are driver listings reviewed?</summary><p>Transport providers must submit the required documents. Eligible driver and vehicle listings should only go live after admin approval.</p></details><details><summary>Can I list my service or vehicle?</summary><p>Create an account and follow the relevant provider registration process. Some listing types require additional review before publication.</p></details></div></section>
  </>;
}
