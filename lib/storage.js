// Simple storage utility for cross-device data persistence
export class CentralizedStorage {
  constructor() {
    this.storageKey = 'amnex-coupon-data';
    this.settingsKey = 'amnex-admin-settings';
  }

  // Get today's date string
  getTodayString() {
    return new Date().toDateString();
  }

  // Get coupon data
  getCouponData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        const today = this.getTodayString();
        
        // Check if data is for today
        if (parsed.date === today) {
          return parsed;
        } else {
          // Reset for new day
          this.resetCouponData();
          return { date: today, count: 0, usedEmployeeIds: [] };
        }
      }
      return { date: this.getTodayString(), count: 0, usedEmployeeIds: [] };
    } catch (error) {
      console.error('Error getting coupon data:', error);
      return { date: this.getTodayString(), count: 0, usedEmployeeIds: [] };
    }
  }

  // Save coupon data
  saveCouponData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // Also save to a backup method (could be expanded to use API)
      this.saveToBackup(this.storageKey, data);
    } catch (error) {
      console.error('Error saving coupon data:', error);
    }
  }

  // Reset coupon data for new day
  resetCouponData() {
    const newData = { 
      date: this.getTodayString(), 
      count: 0, 
      usedEmployeeIds: [] 
    };
    this.saveCouponData(newData);
    return newData;
  }

  // Get admin settings
  getAdminSettings() {
    try {
      const data = localStorage.getItem(this.settingsKey);
      if (data) {
        return JSON.parse(data);
      }
      return {
        maxCoupons: 70,
        startTime: 10,
        startMinutes: 0,
        endTime: 23,
        endMinutes: 0
      };
    } catch (error) {
      console.error('Error getting admin settings:', error);
      return {
        maxCoupons: 70,
        startTime: 10,
        startMinutes: 0,
        endTime: 23,
        endMinutes: 0
      };
    }
  }

  // Save admin settings
  saveAdminSettings(settings) {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
      this.saveToBackup(this.settingsKey, settings);
    } catch (error) {
      console.error('Error saving admin settings:', error);
    }
  }

  // Backup method - can be enhanced to use API calls
  saveToBackup(key, data) {
    try {
      // For now, we'll use sessionStorage as additional backup
      sessionStorage.setItem(`backup_${key}`, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));
      
      // In future, this could make API calls to a server
      // fetch('/api/save-data', { method: 'POST', body: JSON.stringify({ key, data }) });
    } catch (error) {
      console.warn('Backup save failed:', error);
    }
  }

  // Sync data across tabs/windows
  syncData() {
    try {
      // Listen for storage changes from other tabs
      window.addEventListener('storage', (e) => {
        if (e.key === this.storageKey || e.key === this.settingsKey) {
          // Trigger a custom event to notify components
          window.dispatchEvent(new CustomEvent('amnex-data-sync', {
            detail: { key: e.key, newValue: e.newValue }
          }));
        }
      });
    } catch (error) {
      console.warn('Sync setup failed:', error);
    }
  }
}

export const storage = new CentralizedStorage();
