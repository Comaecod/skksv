import { createContext, useContext, useState, useCallback } from 'react';

const SankaraContext = createContext(null);

export function SankaraProvider({ children }) {
  const [isSankaraVisible, setSankaraVisibleState] = useState(true);
  const [isNotificationVisible, setNotificationVisibleState] = useState(true);

  const setSankaraVisible = useCallback((visible) => {
    setSankaraVisibleState(visible);
  }, []);

  const setNotificationVisible = useCallback((visible) => {
    setNotificationVisibleState(visible);
  }, []);

  return (
    <SankaraContext.Provider value={{
      isSankaraVisible,
      setSankaraVisible,
      isNotificationVisible,
      setNotificationVisible,
    }}>
      {children}
    </SankaraContext.Provider>
  );
}

export function useSankara() {
  const ctx = useContext(SankaraContext);
  if (!ctx) throw new Error('useSankara must be used within SankaraProvider');
  return ctx;
}

export default SankaraContext;
