import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    maxCoupons: 70,
    startTime: 10,
    startMinutes: 0,
    endTime: 15, // 3 PM default
    endMinutes: 0,
  });
  
  const [loading, setLoading] = useState(true);

  // Fetch settings from the API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded settings from API:', data);
          setSettings(data);
        } else {
          console.error('Failed to fetch settings from API');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      console.log('Updating settings to:', newSettings);
      
      // Update API
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (response.ok) {
        // Update local state
        setSettings(newSettings);
        console.log('Settings updated successfully');
        return true;
      } else {
        console.error('Failed to update settings via API');
        return false;
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);