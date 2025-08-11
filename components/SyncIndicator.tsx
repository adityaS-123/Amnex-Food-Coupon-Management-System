import { useState, useEffect } from 'react';
import styles from '../styles/SyncIndicator.module.css';

export default function SyncIndicator() {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Update sync time when data changes
    const handleSync = () => {
      setLastSync(new Date());
    };

    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('amnex-data-sync', handleSync);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync time
    setLastSync(new Date());

    return () => {
      window.removeEventListener('amnex-data-sync', handleSync);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={styles.syncIndicator}>
      <div className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`}></div>
      <span className={styles.statusText}>
        {isOnline ? 'Synced' : 'Offline'} 
        {lastSync && (
          <span className={styles.lastSync}>
            • {lastSync.toLocaleTimeString()}
          </span>
        )}
      </span>
    </div>
  );
}
