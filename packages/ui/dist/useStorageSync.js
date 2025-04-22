"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStorageSync = useStorageSync;
// packages/ui/src/useStorageSync.ts
const react_1 = require("react");
function useStorageSync(key, initialValue) {
    const [value, setValue] = (0, react_1.useState)(() => {
        if (typeof window !== 'undefined') {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : initialValue;
        }
        return initialValue;
    });
    (0, react_1.useEffect)(() => {
        const channel = new BroadcastChannel('storage_sync_channel');
        const handleStorageEvent = (e) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    const parsedValue = JSON.parse(e.newValue);
                    setValue(parsedValue);
                }
                catch (error) {
                    console.error('Error parsing storage value:', error);
                }
            }
        };
        const handleBroadcastMessage = (e) => {
            if (e.data.type === 'STORAGE_UPDATE' && e.data.key === key) {
                try {
                    const parsedValue = JSON.parse(e.data.value);
                    setValue(parsedValue);
                }
                catch (error) {
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
    const setStoredValue = (newValue) => {
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
        }
        catch (error) {
            console.error('Error setting storage value:', error);
        }
    };
    return [value, setStoredValue];
}
