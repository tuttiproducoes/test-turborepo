const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

// Armazenamento em memória para os dados
const store = new Map();

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado');

  // Enviar todos os dados armazenados para o novo cliente
  store.forEach((value, key) => {
    ws.send(JSON.stringify({ key, value }));
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Mensagem recebida:', data);

      if (data.type === 'set') {
        // Armazena o novo valor
        store.set(data.key, data.value);
        
        // Broadcast para todos os clientes conectados
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              key: data.key, 
              value: data.value 
            }));
          }
        });
      } else if (data.type === 'get') {
        // Responde apenas ao cliente solicitante
        ws.send(JSON.stringify({ 
          key: data.key, 
          value: store.get(data.key) || null 
        }));
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

console.log('WebSocket Server running on ws://localhost:3000');