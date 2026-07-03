import { createContext, useContext, useState } from 'react';

const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
  const [hideHeader, setHideHeader] = useState(false);
  const [hideFooter, setHideFooter] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);

  return (
    <LayoutContext.Provider value={{ hideHeader, setHideHeader, hideFooter, setHideFooter, hideSidebar, setHideSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider');
  return ctx;
}

export default LayoutContext;
