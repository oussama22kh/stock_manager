import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setToken, onUnauthorized, setBaseUrl } from '../api';

const TOKEN_KEY = 'auth_token';
const API_URL_KEY = 'api_url';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiUrl, setApiUrlState] = useState('');

  const [selectedEmplacement, setSelectedEmplacement] = useState(null);
  const [selectedProduit, setSelectedProduit] = useState(null);

  const [emplacements, setEmplacements] = useState([]);
  const [emplacementsLoading, setEmplacementsLoading] = useState(false);
  const emplacementsLoaded = useRef(false);

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
          setBaseUrl(storedApiUrl);
          setApiUrlState(storedApiUrl);
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
    const trimmed = url.trim();
    setApiUrlState(trimmed);
    if (trimmed) {
      setBaseUrl(trimmed);
      await SecureStore.setItemAsync(API_URL_KEY, trimmed);
    } else {
      setBaseUrl(null);
      try { await SecureStore.deleteItemAsync(API_URL_KEY); } catch {}
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
    }
    setToken(null);
    setTokenState(null);
    setUser(null);
    setSelectedEmplacement(null);
    setSelectedProduit(null);
    emplacementsLoaded.current = false;
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

  const loadEmplacements = useCallback(async () => {
    if (emplacementsLoaded.current) return;
    setEmplacementsLoading(true);
    try {
      const data = await api.get('/emplacements');
      setEmplacements(data);
      emplacementsLoaded.current = true;
    } catch {
    } finally {
      setEmplacementsLoading(false);
    }
  }, []);

  const refreshEmplacements = useCallback(async () => {
    emplacementsLoaded.current = false;
    await loadEmplacements();
  }, [loadEmplacements]);

  return (
    <AppContext.Provider value={{
      token,
      user,
      isLoading,
      login,
      logout,
      apiUrl,
      setApiUrl,
      selectedEmplacement, setSelectedEmplacement,
      selectedProduit, setSelectedProduit,
      cacheProduct, cacheProducts, findCached,
      emplacements, emplacementsLoading, loadEmplacements, refreshEmplacements,
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
