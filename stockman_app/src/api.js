import { API_BASE_URL } from './config';

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

export function setBaseUrl(url) {
  _baseUrl = url;
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

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (res.status === 401) {
    if (_onUnauthorized) _onUnauthorized();
    throw new Error('Non authentifié');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Erreur serveur');
  }

  return data;
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
};

export default api;
