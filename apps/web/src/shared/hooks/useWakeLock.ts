import { useState, useEffect, useCallback } from 'react';

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        setWakeLockSentinel(sentinel);
        setIsLocked(true);

        sentinel.addEventListener('release', () => {
          setIsLocked(false);
          setWakeLockSentinel(null);
        });

        console.log('💡 Screen Wake Lock activado con éxito.');
      } catch (err: any) {
        console.warn('⚠️ No se pudo adquirir Wake Lock:', err.message);
      }
    } else {
      console.warn('⚠️ Wake Lock API no soportada en este navegador.');
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
        setWakeLockSentinel(null);
        setIsLocked(false);
        console.log('💤 Screen Wake Lock liberado.');
      } catch (err: any) {
        console.warn('⚠️ Error al liberar Wake Lock:', err.message);
      }
    }
  }, [wakeLockSentinel]);

  // Re-adquirir si la pestaña vuelve a ser visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLocked) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isLocked, requestWakeLock, releaseWakeLock]);

  return { isLocked, requestWakeLock, releaseWakeLock };
}
