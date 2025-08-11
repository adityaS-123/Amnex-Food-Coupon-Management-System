import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../lib/storage';

// Update the Settings interface to include openCoupons
interface Settings {
  maxCoupons: number;
  startTime: number; // hour in 24-hour format
  startMinutes: number; // minutes (0, 15, 30, 45)
  endTime: number;   // hour in 24-hour format
  endMinutes: number; // minutes (0, 15, 30, 45)
  guestCoupons: number;
  newEmployeeCoupons: number;
  openCoupons: number; // New setting for open coupons
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
}

const defaultSettings: Settings = {
  maxCoupons: 70,
  startTime: 10,
  startMinutes: 0,
  endTime: 23,
  endMinutes: 0,
  guestCoupons: 5,
  newEmployeeCoupons: 10,
  openCoupons: 15 // Default value for open coupons
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    // Initialize storage sync
    storage.syncData();
    
    // Load settings from centralized storage
    const storedSettings = storage.getAdminSettings();
    setSettings(storedSettings);

    // Listen for cross-device sync events
    const handleSync = (event: CustomEvent) => {
      if (event.detail.key === 'amnex-admin-settings') {
        const newSettings = JSON.parse(event.detail.newValue || '{}');
        setSettings(newSettings);
      }
    };

    window.addEventListener('amnex-data-sync', handleSync as EventListener);

    return () => {
      window.removeEventListener('amnex-data-sync', handleSync as EventListener);
    };
  }, []);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    storage.saveAdminSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

