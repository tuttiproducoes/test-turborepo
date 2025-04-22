// packages/ui/src/useStorageSync.ts
import { useEffect, useState } from 'react';

export function useStorageSync<T>(key: string, initialValue?: T): [T | undefined, (value: T) => void] {
  const [value, setValue] = useState<T | undefined>(() => {
    // Carrega o valor inicial do localStorage se existir
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    }
    return initialValue;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : undefined;
          if (JSON.stringify(newValue) !== JSON.stringify(value)) {
            setValue(newValue);
          }
        } catch (error) {
          console.error('Error parsing storage value:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, value]);

  const setStoredValue = (newValue: T) => {
    try {
      const stringifiedValue = JSON.stringify(newValue);
      const currentValue = localStorage.getItem(key);
      
      // Só atualiza se o valor for diferente
      if (currentValue !== stringifiedValue) {
        localStorage.setItem(key, stringifiedValue);
        setValue(newValue);
        
        // Dispara um evento customizado para sincronizar entre abas do mesmo domínio
        // Isso é necessário porque o evento 'storage' só é disparado entre diferentes abas
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { key, newValue: stringifiedValue }
        }));
      }
    } catch (error) {
      console.error('Error setting storage value:', error);
    }
  };

  // Efeito adicional para lidar com eventos customizados na mesma aba
  useEffect(() => {
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        try {
          const newValue = e.detail.newValue ? JSON.parse(e.detail.newValue) : undefined;
          if (JSON.stringify(newValue) !== JSON.stringify(value)) {
            setValue(newValue);
          }
        } catch (error) {
          console.error('Error parsing custom storage value:', error);
        }
      }
    };

    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, [key, value]);

  return [value, setStoredValue];
}