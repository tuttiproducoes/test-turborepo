// packages/ui/src/useWebSocketSync.ts
import { useEffect, useState } from 'react';

let socket: WebSocket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;

const connectWebSocket = (url: string, onMessage: (event: MessageEvent) => void) => {
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

export function useWebSocketSync<T>(key: string, initialValue?: T): [T | undefined, (value: T) => void] {
  const [value, setValue] = useState<T | undefined>(initialValue);

  useEffect(() => {
    const url = 'ws://localhost:3000';
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.key === key) {
          setValue(data.value);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    };

    connectWebSocket(url, handleMessage);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'get', key }));
    } else {
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

  const setStoredValue = (newValue: T) => {
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