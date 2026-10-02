import { useState, useEffect, useRef } from 'react';

export interface GeolocationData {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
}

export function useGeolocation(active: boolean = false) {
  const [position, setPosition] = useState<GeolocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocalización no soportada en este dispositivo.');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed !== null ? Math.round(pos.coords.speed * 3.6) : 0, // m/s a km/h
          heading: pos.coords.heading !== null ? Math.round(pos.coords.heading) : 0,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp
        });
        setError(null);
      },
      (err) => {
        setError(`Error GPS: ${err.message}`);
      },
      options
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active]);

  return { position, error };
}
