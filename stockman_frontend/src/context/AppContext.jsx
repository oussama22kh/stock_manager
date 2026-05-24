import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [user, setUserState] = useState(getStoredUser);
  const [token, setTokenState] = useState(localStorage.getItem('token'));
  const [selectedEmplacement, setSelectedEmplacement] = useState(null);
  const [selectedProduit, setSelectedProduit] = useState(null);

  const setToken = (value) => {
    setTokenState(value);
    if (value) {
      localStorage.setItem('token', value);
    } else {
      localStorage.removeItem('token');
    }
  };

  const setUser = (value) => {
    setUserState(value);
    if (value) {
      localStorage.setItem('user', JSON.stringify(value));
    } else {
      localStorage.removeItem('user');
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      token, setToken,
      selectedEmplacement, setSelectedEmplacement,
      selectedProduit, setSelectedProduit
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
