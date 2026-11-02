import { useEffect, useRef, useState } from 'react';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
let leafletPromise;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!leafletPromise) leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = LEAFLET_CSS; document.head.appendChild(link); }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) { existing.addEventListener('load', () => resolve(window.L), { once: true }); existing.addEventListener('error', reject, { once: true }); return; }
    const script = document.createElement('script'); script.src = LEAFLET_JS; script.async = true; script.onload = () => resolve(window.L); script.onerror = () => reject(new Error('Map library could not load. Check your internet connection and try again.')); document.body.appendChild(script);
  });
  return leafletPromise;
}
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
    if (!response.ok) throw new Error('Address lookup failed');
    const data = await response.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
}
export default function TransportMapPicker({ mode, onModeChange, onSelectLocation, pickupCoordinates, destinationCoordinates }) {
  const mapNode = useRef(null); const mapRef = useRef(null); const markers = useRef({}); const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const [search, setSearch] = useState(''); const [mapError, setMapError] = useState(''); const [searchBusy, setSearchBusy] = useState(false); const [locating, setLocating] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(L => {
      if (cancelled || !mapNode.current || mapRef.current) return;
      const map = L.map(mapNode.current, { zoomControl: true }).setView([16.2, 75.7], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      map.on('click', async event => {
        const { lat, lng } = event.latlng; const coordinates = { latitude: lat, longitude: lng };
        setMapError(''); const activeMode = modeRef.current; onSelectLocation(activeMode, coordinates, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        const label = await reverseGeocode(lat, lng); onSelectLocation(activeMode, coordinates, label);
      });
      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 100);
    }).catch(error => { if (!cancelled) setMapError(error.message); });
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markers.current = {}; } };
  }, []);
  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    const L = window.L; const map = mapRef.current;
    [['pickup', pickupCoordinates, '#c51d37', 'Pickup'], ['destination', destinationCoordinates, '#176a3a', 'Destination']].forEach(([key, point, color, title]) => {
      if (markers.current[key]) { map.removeLayer(markers.current[key]); delete markers.current[key]; }
      if (point?.latitude != null && point?.longitude != null) {
        const marker = L.circleMarker([point.latitude, point.longitude], { radius: 9, color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }).addTo(map).bindTooltip(title, { permanent: true, direction: 'top' });
        markers.current[key] = marker;
      }
    });
    const points = [pickupCoordinates, destinationCoordinates].filter(p => p?.latitude != null && p?.longitude != null).map(p => [p.latitude, p.longitude]);
    if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 14 }); else if (points.length === 1) map.setView(points[0], 14);
  }, [pickupCoordinates, destinationCoordinates]);
  async function searchPlace(event) {
    event.preventDefault(); if (!search.trim()) return; setSearchBusy(true); setMapError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(search.trim() + ', Karnataka, India')}`);
      const results = await response.json(); if (!results.length) throw new Error('Place not found. Try a nearby town, landmark, or area name.');
      const item = results[0]; const coordinates = { latitude: Number(item.lat), longitude: Number(item.lon) };
      mapRef.current?.setView([coordinates.latitude, coordinates.longitude], 14); onSelectLocation(mode, coordinates, item.display_name);
    } catch (error) { setMapError(error.message || 'Could not search for that place.'); } finally { setSearchBusy(false); }
  }
  function locateMe() {
    if (!navigator.geolocation) { setMapError('Location is not supported in this browser. Search for a place or select it on the map.'); return; }
    setLocating(true); setMapError(''); navigator.geolocation.getCurrentPosition(async position => {
      const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      mapRef.current?.setView([coordinates.latitude, coordinates.longitude], 15); const label = await reverseGeocode(coordinates.latitude, coordinates.longitude); onSelectLocation('pickup', coordinates, label); setLocating(false);
    }, () => { setMapError('Location permission was denied. You can search or choose a point on the map.'); setLocating(false); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }
  return <section className="transport-map-card" aria-label="Choose pickup and destination on map">
    <div className="transport-map-heading"><div><span className="eyebrow">PICK YOUR ROUTE</span><h3>Where should we meet you?</h3><p>Search a place or tap the map to set your pickup and destination.</p></div><button className="btn btn-outline map-locate-button" type="button" onClick={locateMe} disabled={locating}>{locating ? 'Locating…' : '⌖ Use my location'}</button></div>
    <div className="map-route-controls"><button type="button" className={mode === 'pickup' ? 'active' : ''} onClick={() => onModeChange('pickup')}><span className="route-dot pickup-dot"/> Set pickup</button><button type="button" className={mode === 'destination' ? 'active' : ''} onClick={() => onModeChange('destination')}><span className="route-dot destination-dot"/> Set destination</button></div>
    <form className="transport-map-search" onSubmit={searchPlace}><span aria-hidden="true">⌕</span><input aria-label="Search a place on map" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search city, area, landmark…"/><button type="submit" disabled={searchBusy}>{searchBusy ? 'Searching…' : 'Find place'}</button></form>
    <div ref={mapNode} className="transport-map-canvas" role="application" aria-label="Interactive OpenStreetMap. Click to select the active location." />
    <div className="map-picked-summary"><div><span className="route-dot pickup-dot"/><div><small>Pickup</small><b>{pickupCoordinates ? `${pickupCoordinates.latitude.toFixed(4)}, ${pickupCoordinates.longitude.toFixed(4)}` : 'Choose on map or use your location'}</b></div></div><div><span className="route-dot destination-dot"/><div><small>Destination</small><b>{destinationCoordinates ? `${destinationCoordinates.latitude.toFixed(4)}, ${destinationCoordinates.longitude.toFixed(4)}` : 'Tap “Set destination”, then choose on map'}</b></div></div></div>
    {mapError && <p className="notice error map-error" role="alert">{mapError}</p>}
    <small className="map-disclaimer">Map data © OpenStreetMap contributors. Location access is optional. Your selected locations are used to prepare this booking.</small>
  </section>;
}
