const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
export const readUser = () => { try { return JSON.parse(sessionStorage.getItem('nuk_user') || 'null'); } catch { return null; } };
export const readToken = () => sessionStorage.getItem('nuk_access_token');
export function saveSession(payload) {
  const data = payload?.data ?? payload;
  if (!data?.user || !data?.accessToken) throw new Error('The server did not return a valid login session.');
  sessionStorage.setItem('nuk_user', JSON.stringify(data.user));
  sessionStorage.setItem('nuk_access_token', data.accessToken);
  if (data.refreshToken) sessionStorage.setItem('nuk_refresh_token', data.refreshToken);
  return data.user;
}
export function clearSession() { ['nuk_user','nuk_access_token','nuk_refresh_token'].forEach(k => sessionStorage.removeItem(k)); }
export async function api(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${API_BASE}/${String(path).replace(/^\//, '')}`, window.location.origin);
  Object.entries(query || {}).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v)); });
  const headers = { Accept: 'application/json' };
  const token = readToken(); if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers, credentials: 'include' };
  if (body !== undefined) { if (body instanceof FormData) opts.body = body; else { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); } }
  let response;
  try { response = await fetch(url, opts); } catch { throw new Error('Cannot reach the backend. Check that the backend is running and VITE_API_BASE_URL is correct.'); }
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || payload?.error || `Request failed (${response.status}).`);
  return payload?.data ?? payload;
}
export const unwrapItems = data => Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.results) ? data.results : [];
