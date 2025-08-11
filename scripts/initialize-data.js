const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create default settings if not exists
const settingsPath = path.join(dataDir, 'settings.json');
if (!fs.existsSync(settingsPath)) {
  console.log('Creating default settings file...');
  const defaultSettings = {
    maxCoupons: 70,
    startTime: 11, // 11 AM
    startMinutes: 0,
    endTime: 16,  // 4 PM
    endMinutes: 0,
    guestCoupons: 20,
    newEmployeeCoupons: 10
  };
  
  fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
  console.log('Default settings created:', defaultSettings);
} else {
  console.log('Settings file already exists');
  // Validate settings
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    console.log('Current settings:', settings);
  } catch (error) {
    console.error('Error reading settings file:', error);
  }
}

console.log('Initialization complete');
