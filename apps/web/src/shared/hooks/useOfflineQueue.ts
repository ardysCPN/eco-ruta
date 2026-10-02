import { useState, useEffect, useCallback } from 'react';
import { socket } from '../services/socket.js';
import { SOCKET_CHANNELS, TelemetriaPosicionDto } from '@eco-ruta/shared';

const STORAGE_KEY = 'eco_ruta_offline_positions';

export function useOfflineQueue(turnoId: string | null) {
  const [queueSize, setQueueSize] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Cargar cola existente
  const getStoredQueue = (): TelemetriaPosicionDto[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const updateStoredQueue = (items: TelemetriaPosicionDto[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setQueueSize(items.length);
    } catch (e) {
      console.error('Error guardando en cola offline:', e);
    }
  };

  // Encolar telemetría
  const enqueuePosition = useCallback((pos: TelemetriaPosicionDto) => {
    if (navigator.onLine && socket.connected) {
      // Envío directo en tiempo real
      socket.emit(SOCKET_CHANNELS.TELEMETRIA_ENVIAR, pos);
    } else {
      // Sin cobertura: guardar en cola
      console.warn('📶 Sin cobertura: encolando posición para envío posterior en ráfaga.');
      const queue = getStoredQueue();
      queue.push(pos);
      updateStoredQueue(queue);
    }
  }, []);

  // Enviar ráfaga acumulada al recuperar conectividad
  const flushQueue = useCallback(() => {
    if (!turnoId) return;
    const queue = getStoredQueue();
    if (queue.length === 0) return;

    console.log(`🚀 Red recuperada: enviando ráfaga de ${queue.length} posiciones retenidas...`);
    socket.emit(SOCKET_CHANNELS.TELEMETRIA_BATCH, {
      turno_id: turnoId,
      posiciones: queue
    });

    updateStoredQueue([]);
  }, [turnoId]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Revisar tamaño inicial
    setQueueSize(getStoredQueue().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue]);

  return { isOnline, queueSize, enqueuePosition, flushQueue };
}
