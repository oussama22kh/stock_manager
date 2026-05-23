import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [selectedEmplacement, setSelectedEmplacement] = useState(null);
  const [selectedProduit, setSelectedProduit] = useState(null);

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
