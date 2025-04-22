// packages/ui/src/useStorageSync.ts
import { useEffect, useState } from 'react';

export function useStorageSync<T>(key: string, initialValue?: T): [T | undefined, (value: T) => void] {
  const [value, setValue] = useState<T | undefined>(() => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    }
    return initialValue;
  });

  useEffect(() => {
    const channel = new BroadcastChannel('storage_sync_channel');

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsedValue = JSON.parse(e.newValue);
          setValue(parsedValue);
        } catch (error) {
          console.error('Error parsing storage value:', error);
        }
      }
    };

    const handleBroadcastMessage = (e: MessageEvent) => {
      if (e.data.type === 'STORAGE_UPDATE' && e.data.key === key) {
        try {
          const parsedValue = JSON.parse(e.data.value);
          setValue(parsedValue);
        } catch (error) {
          console.error('Error parsing broadcast value:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    channel.addEventListener('message', handleBroadcastMessage);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      channel.removeEventListener('message', handleBroadcastMessage);
      channel.close();
    };
  }, [key]);

  const setStoredValue = (newValue: T) => {
    try {
      const stringValue = JSON.stringify(newValue);
      localStorage.setItem(key, stringValue);
      setValue(newValue);
      
      const channel = new BroadcastChannel('storage_sync_channel');
      channel.postMessage({ 
        type: 'STORAGE_UPDATE', 
        key, 
        value: stringValue 
      });
      setTimeout(() => channel.close(), 100);
    } catch (error) {
      console.error('Error setting storage value:', error);
    }
  };

  return [value, setStoredValue];
}