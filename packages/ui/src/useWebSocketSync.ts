// packages/ui/src/useWebSocketSync.ts
import { useEffect, useState } from 'react';

let socket: WebSocket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000; // 3 segundos

const connectWebSocket = (url: string, onMessage: (event: MessageEvent) => void) => {
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('WebSocket conectado');
    reconnectAttempts = 0; // Resetar tentativas após conexão bem-sucedida
  };

  socket.onmessage = onMessage;

  socket.onclose = (event) => {
    if (event.wasClean) {
      console.log(`Conexão fechada limpa, código=${event.code} motivo=${event.reason}`);
    } else {
      console.log('Conexão perdida');
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Tentando reconectar (${reconnectAttempts}/${maxReconnectAttempts})...`);
        setTimeout(() => connectWebSocket(url, onMessage), reconnectDelay);
      }
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

    // Solicitar estado inicial
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'get', key }));
    } else {
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({ type: 'get', key }));
      }, { once: true });
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [key]);

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'set', 
        key, 
        value: newValue 
      }));
    } else {
      console.error('WebSocket não está conectado');
    }
  };

  return [value, setStoredValue];
}