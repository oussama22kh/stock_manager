import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setToken, onUnauthorized, setBaseUrl } from '../api';

const TOKEN_KEY = 'auth_token';
const API_URL_KEY = 'api_url';

function normalizeApiUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const noTrailing = trimmed.replace(/\/+$/, '');
  if (noTrailing.endsWith('/api')) return noTrailing;
  return noTrailing + '/api';
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiUrl, setApiUrlState] = useState('');

  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedEmplacement, setSelectedEmplacement] = useState(null);
  const [selectedProduit, setSelectedProduit] = useState(null);

  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [warehousesError, setWarehousesError] = useState(null);
  const warehousesLoaded = useRef(false);

  const [emplacements, setEmplacements] = useState([]);
  const [emplacementsLoading, setEmplacementsLoading] = useState(false);

  const productsCache = useRef(new Map());

  const handleLogout = useRef(() => {});

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedApiUrl] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(API_URL_KEY),
        ]);
        if (storedToken) {
          setToken(storedToken);
          setTokenState(storedToken);
        }
        if (storedApiUrl) {
          const normalized = normalizeApiUrl(storedApiUrl);
          setBaseUrl(normalized);
          setApiUrlState(normalized);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    onUnauthorized(handleLogout.current);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.post('/login', { login: username, password });
    const newToken = data.token;
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
    setTokenState(newToken);
    setUser(data.user || null);
  }, []);

  const setApiUrl = useCallback(async (url) => {
    const normalized = normalizeApiUrl(url);
    setApiUrlState(normalized);
    if (normalized) {
      setBaseUrl(normalized);
      await SecureStore.setItemAsync(API_URL_KEY, normalized);
    } else {
      setBaseUrl(null);
      try { await SecureStore.deleteItemAsync(API_URL_KEY); } catch {}
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/logout'); } catch {}
    try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
    setToken(null);
    setTokenState(null);
    setUser(null);
    setSelectedWarehouse(null);
    setSelectedEmplacement(null);
    setSelectedProduit(null);
    warehousesLoaded.current = false;
    setEmplacements([]);
    productsCache.current.clear();
  }, []);

  handleLogout.current = logout;

  const cacheProduct = useCallback((product) => {
    if (product?.code_produit) {
      productsCache.current.set(product.code_produit, product);
    }
  }, []);

  const cacheProducts = useCallback((list) => {
    for (const p of list) {
      if (p?.code_produit) {
        productsCache.current.set(p.code_produit, p);
      }
    }
  }, []);

  const findCached = useCallback((barcode) => {
    return productsCache.current.get(barcode) || null;
  }, []);

  const loadWarehouses = useCallback(async () => {
    if (warehousesLoaded.current) return;
    setWarehousesLoading(true);
    setWarehousesError(null);
    try {
      const data = await api.get('/emplacements');
      setWarehouses(data);
      warehousesLoaded.current = true;
    } catch (err) {
      setWarehousesError(err.message || 'Erreur lors du chargement');
    } finally {
      setWarehousesLoading(false);
    }
  }, []);

  const refreshWarehouses = useCallback(async () => {
    warehousesLoaded.current = false;
    await loadWarehouses();
  }, [loadWarehouses]);

  const loadEmplacements = useCallback(async (warehouseId) => {
    setEmplacementsLoading(true);
    setEmplacements([]);
    try {
      const data = await api.get(`/warehouses/${warehouseId}/emplacements`);
      setEmplacements(data);
    } catch {
      setEmplacements([]);
    } finally {
      setEmplacementsLoading(false);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      token,
      user,
      isLoading,
      login,
      logout,
      apiUrl,
      setApiUrl,
      selectedWarehouse, setSelectedWarehouse,
      selectedEmplacement, setSelectedEmplacement,
      selectedProduit, setSelectedProduit,
      cacheProduct, cacheProducts, findCached,
      warehouses, warehousesLoading, warehousesError, loadWarehouses, refreshWarehouses,
      emplacements, emplacementsLoading, loadEmplacements,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
