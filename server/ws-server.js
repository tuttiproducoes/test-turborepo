const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Configurações
const PORT = 3000;
const MAX_STORE_SIZE = 100; // Limite de itens na store
const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB

// Armazenamento com TTL (Time To Live) e limite de tamanho
class EnhancedStore {
  constructor() {
    this.store = new Map();
    this.size = 0;
  }

  set(key, value, ttl = 3600000) { // 1 hora padrão
    if (this.size >= MAX_STORE_SIZE) {
      const firstKey = this.store.keys().next().value;
      this.delete(firstKey);
    }

    this.store.set(key, {
      data: value,
      expires: Date.now() + ttl
    });
    this.size++;
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key) {
    if (this.store.delete(key)) this.size--;
  }
}

const store = new EnhancedStore();
const activeClients = new Map();

const wss = new WebSocket.Server({ port: PORT });

// Middleware de validação
function validateMessage(message) {
  try {
    const data = JSON.parse(message);
    if (typeof data !== 'object' || data === null) return { valid: false };
    
    if (!['set', 'get', 'delete'].includes(data.type)) {
      return { valid: false, error: 'Tipo de operação inválido' };
    }

    if (typeof data.key !== 'string') {
      return { valid: false, error: 'Chave inválida' };
    }

    if (data.type === 'set' && data.value === undefined) {
      return { valid: false, error: 'Valor ausente para operação set' };
    }

    return { valid: true, data };
  } catch (e) {
    return { valid: false, error: 'JSON inválido' };
  }
}

// Limpeza periódica da store
setInterval(() => {
  const now = Date.now();
  for (const [key, { expires }] of store.store) {
    if (now > expires) store.delete(key);
  }
}, 60000); // A cada minuto

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  const clientIp = req.socket.remoteAddress;
  activeClients.set(clientId, { ws, ip: clientIp });

  console.log(`Novo cliente conectado - ID: ${clientId}, IP: ${clientIp}`);

  // Controle de mensagens grandes
  ws._socket.on('data', (data) => {
    if (data.length > MAX_MESSAGE_SIZE) {
      ws.close(1009, "Mensagem muito grande");
    }
  });

  // Heartbeat
  let isAlive = true;
  const heartbeatInterval = setInterval(() => {
    if (!isAlive) {
      ws.terminate();
      return;
    }
    isAlive = false;
    ws.ping();
  }, 30000);

  ws.on('pong', () => {
    isAlive = true;
  });

  // Envio inicial dos dados
  ws.send(JSON.stringify({
    type: 'init',
    clientId,
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const { valid, data, error } = validateMessage(message);
      if (!valid) {
        return ws.send(JSON.stringify({
          type: 'error',
          error: error || 'Mensagem inválida',
          timestamp: new Date().toISOString()
        }));
      }

      console.log(`Mensagem recebida de ${clientId}:`, data);

      switch (data.type) {
        case 'set':
          store.set(data.key, data.value);
          broadcast({
            type: 'update',
            key: data.key,
            value: data.value,
            source: clientId
          });
          break;

        case 'get':
          ws.send(JSON.stringify({
            type: 'response',
            key: data.key,
            value: store.get(data.key),
            timestamp: new Date().toISOString()
          }));
          break;

        case 'delete':
          store.delete(data.key);
          broadcast({
            type: 'delete',
            key: data.key,
            source: clientId
          });
          break;
      }
    } catch (error) {
      console.error(`Erro com cliente ${clientId}:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Erro interno no servidor',
        details: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  });

  ws.on('close', () => {
    clearInterval(heartbeatInterval);
    activeClients.delete(clientId);
    console.log(`Cliente desconectado - ID: ${clientId}`);
  });

  ws.on('error', (error) => {
    console.error(`Erro com cliente ${clientId}:`, error);
  });
});

function broadcast(message, excludeClientId = null) {
  const messageStr = JSON.stringify(message);
  
  wss.clients.forEach(client => {
    if (
      client.readyState === WebSocket.OPEN &&
      (!excludeClientId || activeClients.get(clientId)?.ws !== client)
    ) {
      client.send(messageStr);
    }
  });
}

console.log(`WebSocket Server running on ws://localhost:${PORT}`);