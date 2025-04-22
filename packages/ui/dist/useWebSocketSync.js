"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocketSync = useWebSocketSync;
// packages/ui/src/useWebSocketSync.ts
const react_1 = require("react");
let socket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;
const connectWebSocket = (url, onMessage) => {
    socket = new WebSocket(url);
    socket.onopen = () => {
        console.log('WebSocket conectado');
        reconnectAttempts = 0;
    };
    socket.onmessage = onMessage;
    socket.onclose = (event) => {
        if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(() => connectWebSocket(url, onMessage), reconnectDelay);
        }
    };
    socket.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
    };
};
function useWebSocketSync(key, initialValue) {
    const [value, setValue] = (0, react_1.useState)(initialValue);
    (0, react_1.useEffect)(() => {
        const url = 'ws://localhost:3000';
        const handleMessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.key === key) {
                    setValue(data.value);
                }
            }
            catch (error) {
                console.error('Erro ao processar mensagem:', error);
            }
        };
        connectWebSocket(url, handleMessage);
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'get', key }));
        }
        else {
            const openHandler = () => {
                socket.send(JSON.stringify({ type: 'get', key }));
                socket.removeEventListener('open', openHandler);
            };
            socket.addEventListener('open', openHandler);
        }
        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, [key]);
    const setStoredValue = (newValue) => {
        setValue(newValue);
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'set',
                key,
                value: newValue
            }));
        }
    };
    return [value, setStoredValue];
}
