import { createContext, useContext, useState, useCallback } from 'react';

const SankaraContext = createContext(null);

export function SankaraProvider({ children }) {
  const [isVisible, setIsVisible] = useState(true);

  const setSankaraVisible = useCallback((visible) => {
    setIsVisible(visible);
  }, []);

  return (
    <SankaraContext.Provider value={{ isSankaraVisible: isVisible, setSankaraVisible }}>
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
