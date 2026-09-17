"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ViewMode = 'canvas' | 'feed';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: 'canvas',
  setViewMode: () => {},
});

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>('canvas');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('focusdeck_view_mode') as ViewMode;
      if (saved === 'canvas' || saved === 'feed') {
        setViewModeState(saved);
      }
    } catch {
      // Ignore read errors
    }
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem('focusdeck_view_mode', mode);
    } catch {
      // Ignore write errors
    }
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export const useViewMode = () => useContext(ViewModeContext);
