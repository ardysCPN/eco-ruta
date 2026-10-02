import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.VITE_WS_URL || (window.location.port === '3000' ? 'http://localhost:3005' : window.location.origin);

export const socket: Socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('⚡ Conectado al Gateway WebSocket de ECO-RUTA:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('⚠️ Desconectado del WebSocket:', reason);
});
