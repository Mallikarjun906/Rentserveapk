import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

const CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
let leafletLoad;
function ensureLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletLoad) leafletLoad = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = CSS_URL; document.head.appendChild(link); }
    let script = document.querySelector(`script[src="${JS_URL}"]`);
    if (!script) { script = document.createElement('script'); script.src = JS_URL; script.async = true; document.body.appendChild(script); }
    script.addEventListener('load', () => resolve(window.L), { once: true });
    script.addEventListener('error', () => reject(new Error('Map library failed to load.')), { once: true });
  });
  return leafletLoad;
}

export default function TransportTripTracker({ booking, role, onChanged }) {
  const node = useRef(null); const map = useRef(null); const markers = useRef({}); const watchId = useRef(null); const lastSentAt = useRef(0);
  const [tracking, setTracking] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const active = ['accepted', 'in_progress'].includes(booking.status);

  async function refresh() {
    try { const result = await api(`transport-bookings/${booking._id}/tracking`); setTracking(result); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 4000);
    return () => { window.clearInterval(timer); if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current); if (map.current) { map.current.remove(); map.current = null; } };
  }, [booking._id]);

  useEffect(() => {
    let cancelled = false;
    ensureLeaflet().then(L => {
      if (cancelled || !node.current || map.current) return;
      map.current = L.map(node.current).setView([16.2, 75.7], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map.current);
      window.setTimeout(() => { map.current?.invalidateSize(); setTracking(current => current ? { ...current } : current); }, 100);
    }).catch(e => setError(e.message));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!window.L || !map.current || !tracking) return;
    const L = window.L; const points = [];
    const values = [
      ['pickup', tracking.pickupCoordinates, '#c51d37', 'Pickup'],
      ['destination', tracking.destinationCoordinates, '#176a3a', 'Destination'],
      ['driver', tracking.liveLocation, '#2563eb', 'Driver live location']
    ];
    values.forEach(([key, point, color, label]) => {
      if (markers.current[key]) { map.current.removeLayer(markers.current[key]); delete markers.current[key]; }
      if (point && Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude))) {
        const marker = L.circleMarker([Number(point.latitude), Number(point.longitude)], { radius: key === 'driver' ? 10 : 7, color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }).addTo(map.current).bindTooltip(label);
        markers.current[key] = marker; points.push([Number(point.latitude), Number(point.longitude)]);
      }
    });
    if (points.length > 1) map.current.fitBounds(points, { padding: [30, 30], maxZoom: 15 }); else if (points.length === 1) map.current.setView(points[0], 15);
  }, [tracking]);

  async function updateStatus(status) {
    setBusy(true); setError('');
    try { await api(`transport-bookings/${booking._id}/status`, { method: 'PATCH', body: { status } }); await refresh(); onChanged?.(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function startGps() {
    if (!navigator.geolocation) { setError('This browser does not support GPS.'); return; }
    if (watchId.current !== null) return;
    setError('');
    watchId.current = navigator.geolocation.watchPosition(async position => {
      const now = Date.now(); if (now - lastSentAt.current < 5000) return; lastSentAt.current = now;
      try {
        await api(`transport-bookings/${booking._id}/location`, { method: 'PATCH', body: { locationCoordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude }, accuracy: position.coords.accuracy, heading: position.coords.heading ?? undefined, speed: position.coords.speed == null ? undefined : Math.max(0, position.coords.speed * 3.6) } });
        setError(''); await refresh();
      } catch (e) { setError(e.message); }
    }, () => setError('GPS permission was denied or location is unavailable. Allow location access and try again.'), { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
  }

  useEffect(() => {
    if (role === 'provider' && booking.status === 'in_progress') startGps();
    if (!active && watchId.current !== null && navigator.geolocation) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; }
  }, [booking.status]);

  return <section className="trip-tracker-card">
    <div className="trip-tracker-header"><div><span className="eyebrow">LIVE TRIP MAP</span><h3>{booking.status === 'in_progress' ? 'Trip in progress' : booking.status === 'completed' ? 'Trip completed' : 'Driver tracking'}</h3></div><span className={`trip-live-pill ${tracking?.liveLocation?.updatedAt && Date.now() - new Date(tracking.liveLocation.updatedAt).getTime() < 20000 ? 'is-live' : ''}`}>{tracking?.liveLocation?.updatedAt && Date.now() - new Date(tracking.liveLocation.updatedAt).getTime() < 20000 ? '● GPS LIVE' : 'Waiting for GPS'}</span></div>
    <div ref={node} className="trip-tracker-map" aria-label="Live trip map" />
    <div className="trip-tracker-meta"><span><i className="route-dot pickup-dot"/> Pickup: {booking.pickup}</span><span><i className="route-dot destination-dot"/> Destination: {booking.destination}</span></div>
    {role === 'provider' && booking.status === 'accepted' && <button className="btn btn-full" disabled={busy} onClick={() => updateStatus('in_progress')}>{busy ? 'Starting…' : 'Start trip & share live GPS'}</button>}
    {role === 'provider' && booking.status === 'in_progress' && <><p className="muted tiny">Keep this page open and allow location permission while the trip is active. GPS updates are sent about every 5 seconds.</p><button className="btn btn-full" disabled={busy} onClick={() => updateStatus('completed')}>{busy ? 'Finishing…' : 'Complete trip & stop tracking'}</button></>}
    {tracking?.liveLocation?.updatedAt && <small className="muted">Last GPS update: {new Date(tracking.liveLocation.updatedAt).toLocaleTimeString()} {tracking.liveLocation.accuracy ? `· accuracy ±${Math.round(tracking.liveLocation.accuracy)} m` : ''}</small>}
    {error && <p className="notice error" role="alert">{error}</p>}
  </section>;
}
