import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface NavigationLoaderValue {
  isNavigating: boolean;
  start: () => void;
  stop: () => void;
}

const NavigationLoaderContext = createContext<NavigationLoaderValue | undefined>(undefined);

export const NavigationLoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavigating, setIsNavigating] = useState(false);

  const start = useCallback(() => setIsNavigating(true), []);
  const stop = useCallback(() => setIsNavigating(false), []);

  const value = useMemo(() => ({ isNavigating, start, stop }), [isNavigating, start, stop]);

  return <NavigationLoaderContext.Provider value={value}>{children}</NavigationLoaderContext.Provider>;
};

export const useNavigationLoader = () => {
  const context = useContext(NavigationLoaderContext);
  if (!context) throw new Error("useNavigationLoader must be used inside NavigationLoaderProvider");
  return context;
};
