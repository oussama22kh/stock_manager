import { API_BASE_URL } from './config';

const DEFAULT_TIMEOUT = 15000;

let _token = null;
let _onUnauthorized = null;
let _baseUrl = null;

export function setToken(token) {
  _token = token;
}

export function getToken() {
  return _token;
}

export function onUnauthorized(callback) {
  _onUnauthorized = callback;
}

function normalizeUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  const noTrailing = trimmed.replace(/\/+$/, '');
  if (noTrailing.endsWith('/api')) return noTrailing;
  return noTrailing + '/api';
}

export function setBaseUrl(url) {
  _baseUrl = url ? normalizeUrl(url) : null;
}

export function getBaseUrl() {
  return _baseUrl || API_BASE_URL;
}

async function request(method, path, body = null) {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const headers = { 'Content-Type': 'application/json' };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  const options = { method, headers, signal: controller.signal };
  if (body) {
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Le serveur ne répond pas');
    }
    throw new Error('Impossible de joindre le serveur');
  }

  clearTimeout(timer);

  if (res.status === 401) {
    if (_onUnauthorized) _onUnauthorized();
    throw new Error('Non authentifié');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Erreur serveur (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.message || `Erreur serveur (${res.status})`);
  }

  return data;
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

export default api;
