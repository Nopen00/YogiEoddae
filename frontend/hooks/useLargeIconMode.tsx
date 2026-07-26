import React, { createContext, useContext, useState } from 'react';

interface LargeIconModeContextValue {
  isLargeIconMode: boolean;
  setIsLargeIconMode: (value: boolean) => void;
}

const LargeIconModeContext = createContext<LargeIconModeContextValue | undefined>(undefined);

export const LargeIconModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLargeIconMode, setIsLargeIconMode] = useState(false);
  return (
    <LargeIconModeContext.Provider value={{ isLargeIconMode, setIsLargeIconMode }}>
      {children}
    </LargeIconModeContext.Provider>
  );
};

export const useLargeIconMode = () => {
  const ctx = useContext(LargeIconModeContext);
  if (!ctx) throw new Error('useLargeIconMode must be used within LargeIconModeProvider');
  return ctx;
};
