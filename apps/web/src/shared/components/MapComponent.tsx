import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Sun, Moon, Crosshair, MapPin, Navigation, Check } from 'lucide-react';
import { obtenerBarrioYComunaCercana } from '@eco-ruta/shared';

export interface TruckMarkerData {
  id?: string;
  lat: number;
  lng: number;
  rumbo?: number;
  velocidad?: number;
  placa?: string;
  avance?: number;
}

export interface InmuebleMarkerData {
  id: string;
  etiqueta: string;
  lat: number;
  lng: number;
  direccion?: string;
  minutos_preaviso?: number;
}

export interface PuntoAcopioData {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  tiempo_parada_min?: number;
  orden?: number;
}

export interface NovedadViaData {
  id: string;
  tipo_novedad: string;
  descripcion?: string;
  lat: number;
  lng: number;
}

export interface CuencaData {
  id: string;
  quebrada: string;
  nivel_riesgo: string;
  descripcion: string;
  lat: number;
  lng: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensidad?: number;
}

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  truck?: TruckMarkerData | null;
  multiTrucks?: TruckMarkerData[];
  historialPuntos?: [number, number][];
  showBreadcrumbs?: boolean;
  routeGeoJson?: any | null;
  inmuebles?: InmuebleMarkerData[];
  puntosAcopio?: PuntoAcopioData[];
  novedadesVia?: NovedadViaData[];
  cuencas?: CuencaData[];
  heatmapPoints?: HeatmapPoint[];
  showHeatmap?: boolean;
  pqrsList?: any[];
  selectedPoint?: { lat: number; lng: number; label?: string; color?: string } | null;
  onMapClick?: (lat: number, lng: number) => void;
  onAddPoint?: (lat: number, lng: number) => void;
  customWaypoints?: [number, number][];
  calculatedRouteGeoJSON?: any | null;
  height?: string;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  enableCenterTarget?: boolean;
  targetConfirmLabel?: string;
  hideConfirmButton?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  center = [5.6940, -76.6580], // Quibdó Centro (Plaza / Malecón)
  zoom = 15,
  truck = null,
  multiTrucks = [],
  historialPuntos = [],
  showBreadcrumbs = false, // Desactivado por defecto a petición del usuario
  routeGeoJson = null,
  calculatedRouteGeoJSON = null,
  customWaypoints = [],
  inmuebles = [],
  puntosAcopio = [],
  novedadesVia = [],
  cuencas = [],
  heatmapPoints = [],
  showHeatmap = false,
  selectedPoint = null,
  onMapClick,
  onAddPoint,
  height = '520px',
  theme,
  enableCenterTarget,
  targetConfirmLabel,
  hideConfirmButton = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const multiTrucksGroupRef = useRef<L.LayerGroup | null>(null);
  const historyPolylineRef = useRef<L.Polyline | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const waypointsLayerRef = useRef<L.LayerGroup | null>(null);
  const inmueblesLayerRef = useRef<L.LayerGroup | null>(null);
  const acopioLayerRef = useRef<L.LayerGroup | null>(null);
  const novedadesLayerRef = useRef<L.LayerGroup | null>(null);
  const cuencasLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedPointLayerRef = useRef<L.LayerGroup | null>(null);

  // Modo Claro / Modo Oscuro
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
    if (theme) return theme;
    return (localStorage.getItem('eco_map_theme') as 'dark' | 'light') || 'dark';
  });

  // Mira Central de Ubicación (Uber/InDrive para Móvil iOS y Web)
  const [isCenterTargetActive, setIsCenterTargetActive] = useState<boolean>(() =>
    enableCenterTarget !== undefined ? enableCenterTarget : Boolean(onMapClick || onAddPoint)
  );
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({ lat: center[0], lng: center[1] });
  const [centerBarrio, setCenterBarrio] = useState<string | null>(null);

  // Animación suave de movimiento continuo (estilo InDrive/Uber)
  const animFrameRef = useRef<number | null>(null);
  const currentPosRef = useRef<{ lat: number; lng: number; heading: number } | null>(null);

  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  const onAddPointRef = useRef(onAddPoint);
  useEffect(() => {
    onAddPointRef.current = onAddPoint;
  }, [onAddPoint]);

  // Inicializar mapa de Quibdó
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      tap: false
    } as any).setView(center, zoom);

    // Tiles iniciales según tema
    const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Capas agrupadas
    multiTrucksGroupRef.current = L.layerGroup().addTo(map);
    waypointsLayerRef.current = L.layerGroup().addTo(map);
    inmueblesLayerRef.current = L.layerGroup().addTo(map);
    acopioLayerRef.current = L.layerGroup().addTo(map);
    novedadesLayerRef.current = L.layerGroup().addTo(map);
    cuencasLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);
    selectedPointLayerRef.current = L.layerGroup().addTo(map);

    // Click handler y Long-press (Móvil y Web)
    const triggerClick = (lat: number, lng: number) => {
      if (onMapClickRef.current) onMapClickRef.current(lat, lng);
      if (onAddPointRef.current) onAddPointRef.current(lat, lng);
    };

    map.on('click', (e: L.LeafletMouseEvent) => {
      triggerClick(e.latlng.lat, e.latlng.lng);
    });

    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
      }
      triggerClick(e.latlng.lat, e.latlng.lng);
    });

    // Tracking de movimiento del mapa para la Mira Central
    map.on('move', () => {
      const c = map.getCenter();
      setCenterCoords({ lat: c.lat, lng: c.lng });
      const detected = obtenerBarrioYComunaCercana(c.lat, c.lng, 900);
      setCenterBarrio(detected ? detected.barrio : null);
    });

    // Soporte táctil optimizado para iOS Safari / WebKit (ignora micro-movimientos para no perder taps)
    const container = mapContainerRef.current;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
        const dt = Date.now() - touchStartTime;

        // Si el usuario dio un tap nítido (movimiento < 12px y tiempo < 380ms)
        if (dx < 12 && dy < 12 && dt < 380 && container && mapInstanceRef.current) {
          const rect = container.getBoundingClientRect();
          const point = L.point(
            e.changedTouches[0].clientX - rect.left,
            e.changedTouches[0].clientY - rect.top
          );
          const latlng = mapInstanceRef.current.containerPointToLatLng(point);
          triggerClick(latlng.lat, latlng.lng);
        }
      }
    };

    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    mapInstanceRef.current = map;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Confirmar el punto central de la mira (Especial para móviles táctiles)
  const handleConfirmCenterPoint = useCallback(() => {
    if (mapInstanceRef.current) {
      const c = mapInstanceRef.current.getCenter();
      if (onMapClickRef.current) onMapClickRef.current(c.lat, c.lng);
      if (onAddPointRef.current) onAddPointRef.current(c.lat, c.lng);
    }
  }, []);

  // Ubicar usando GPS del dispositivo móvil
  const handleUseGps = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          }
          if (onMapClickRef.current) onMapClickRef.current(lat, lng);
          if (onAddPointRef.current) onAddPointRef.current(lat, lng);
        },
        (err) => {
          console.warn('GPS location error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const toggleTheme = () => {
    const next = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(next);
    localStorage.setItem('eco_map_theme', next);
  };

  // Sincronizar centro cuando cambie el predio enfocado
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.panTo(center, { animate: true, duration: 1 });
    }
  }, [center[0], center[1]]);

  // Actualizar Trazado Oficial de Ruta Quibdó (GeoJSON nítido verde esmeralda)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeGeoJson) {
      routeLayerRef.current = L.geoJSON(routeGeoJson, {
        style: {
          color: '#10b981',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }
      }).addTo(map);

      if (!truck && routeLayerRef.current.getBounds().isValid()) {
        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] });
      }
    }
  }, [routeGeoJson]);

  // Actualizar Historial de Puntos (Solo si showBreadcrumbs está habilitado)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (historyPolylineRef.current) {
      map.removeLayer(historyPolylineRef.current);
      historyPolylineRef.current = null;
    }

    if (showBreadcrumbs && historialPuntos.length > 1) {
      historyPolylineRef.current = L.polyline(historialPuntos, {
        color: '#06b6d4',
        weight: 3,
        opacity: 0.6
      }).addTo(map);
    }
  }, [historialPuntos, showBreadcrumbs]);

  // ANIMACIÓN SUAVE DEL COMPACTADOR (Estilo InDrive / Uber)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!truck) {
      if (truckMarkerRef.current) {
        map.removeLayer(truckMarkerRef.current);
        truckMarkerRef.current = null;
      }
      currentPosRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const newTargetLat = truck.lat;
    const newTargetLng = truck.lng;
    const newTargetHeading = truck.rumbo || 0;

    // Si es la primera vez que se monta el camión
    if (!currentPosRef.current) {
      currentPosRef.current = { lat: newTargetLat, lng: newTargetLng, heading: newTargetHeading };

      const customIcon = L.divIcon({
        className: 'custom-truck-uber-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div class="truck-rotate-body" style="width: 34px; height: 34px; background: #0f172a; border: 2.5px solid #10b981; border-radius: 9px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.6); transform: rotate(${newTargetHeading}deg); transition: transform 0.3s ease;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      truckMarkerRef.current = L.marker([newTargetLat, newTargetLng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<b>Aguas del Atrato &bull; Quibdó</b><br/>${truck.placa || 'Compactador COMP-01'}<br/>Velocidad: ${truck.velocidad || 18} km/h`);

      map.panTo([newTargetLat, newTargetLng], { animate: true, duration: 1.0 });
      return;
    }

    // Si ya existe, animamos suavemente hacia las nuevas coordenadas en ~3.2 segundos
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const startLat = currentPosRef.current.lat;
    const startLng = currentPosRef.current.lng;
    const startHeading = currentPosRef.current.heading;
    const startTime = performance.now();
    const duration = 3200; // cubre fluidamente el intervalo de 3.5s

    // Cálculo del menor ángulo de rotación (-180 a 180)
    let headingDiff = ((newTargetHeading - startHeading + 180) % 360) - 180;
    if (headingDiff < -180) headingDiff += 360;

    const animateMovement = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Interpolación lineal con amortiguación suave
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const interpolatedLat = startLat + (newTargetLat - startLat) * easeProgress;
      const interpolatedLng = startLng + (newTargetLng - startLng) * easeProgress;
      const interpolatedHeading = startHeading + headingDiff * easeProgress;

      currentPosRef.current = {
        lat: interpolatedLat,
        lng: interpolatedLng,
        heading: interpolatedHeading
      };

      if (truckMarkerRef.current) {
        truckMarkerRef.current.setLatLng([interpolatedLat, interpolatedLng]);

        const el = truckMarkerRef.current.getElement();
        if (el) {
          const body = el.querySelector('.truck-rotate-body') as HTMLElement;
          if (body) {
            body.style.transform = `rotate(${interpolatedHeading}deg)`;
          }
        }
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateMovement);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateMovement);
    map.panTo([newTargetLat, newTargetLng], { animate: true, duration: 1.5 });
  }, [truck]);

  // Multi-Flota (Torre de Despacho Aguas del Atrato)
  useEffect(() => {
    if (!multiTrucksGroupRef.current) return;
    multiTrucksGroupRef.current.clearLayers();

    multiTrucks.forEach((t) => {
      const heading = t.rumbo || 0;
      const icon = L.divIcon({
        className: 'multi-truck-marker',
        html: `
          <div style="
            background: #0f172a;
            border: 2px solid #38bdf8;
            border-radius: 6px;
            padding: 4px 6px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.6);
            white-space: nowrap;
          ">
            <span style="display:inline-block; transform: rotate(${heading}deg);">🚚</span>
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8;">${t.placa || 'COMP'}</span>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

      L.marker([t.lat, t.lng], { icon })
        .bindPopup(`<b>${t.placa}</b><br/>Vel: ${t.velocidad || 0} km/h<br/>Avance: ${t.avance || 0}%`)
        .addTo(multiTrucksGroupRef.current!);
    });
  }, [multiTrucks]);

  // Puntos de Acopio Obligatorios (Marcadores Verdes con Paradas de 2 a 5 min)
  useEffect(() => {
    if (!acopioLayerRef.current) return;
    acopioLayerRef.current.clearLayers();

    puntosAcopio.forEach((acopio) => {
      const icon = L.divIcon({
        className: 'acopio-marker',
        html: `
          <div style="
            background: #059669;
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 800;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
          ">
            🛑
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([acopio.lat, acopio.lng], { icon })
        .bindPopup(`<b>${acopio.nombre}</b><br/>Parada Obligatoria Cuadrilla: <b>${acopio.tiempo_parada_min || 3} minutos</b>`)
        .addTo(acopioLayerRef.current!);
    });
  }, [puntosAcopio]);

  // Inmuebles Privados del Ciudadano (100% privados para el usuario)
  useEffect(() => {
    if (!inmueblesLayerRef.current) return;
    inmueblesLayerRef.current.clearLayers();

    inmuebles.forEach((inm) => {
      const icon = L.divIcon({
        className: 'inmueble-marker',
        html: `
          <div style="
            background: #3b82f6;
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 8px;
            padding: 2px 6px;
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
            white-space: nowrap;
          ">
            🏠 <span>${inm.etiqueta}</span>
          </div>
        `,
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      });

      L.marker([inm.lat, inm.lng], { icon })
        .bindPopup(`<b>Mi Predio Privado</b><br/>${inm.etiqueta}<br/>Preaviso: <b>${inm.minutos_preaviso || 10} min</b>`)
        .addTo(inmueblesLayerRef.current!);
    });
  }, [inmuebles]);

  // Novedades de Vía (Calles Inundadas, Bloqueos en Quibdó)
  useEffect(() => {
    if (!novedadesLayerRef.current) return;
    novedadesLayerRef.current.clearLayers();

    novedadesVia.forEach((nov) => {
      const icon = L.divIcon({
        className: 'novedad-marker',
        html: `
          <div style="
            background: #dc2626;
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            box-shadow: 0 0 10px rgba(220, 38, 38, 0.6);
          ">
            ⚠️
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      L.marker([nov.lat, nov.lng], { icon })
        .bindPopup(`<b>Novedad Operativa Quibdó</b><br/><b>${nov.tipo_novedad.toUpperCase().replace('_', ' ')}</b><br/>${nov.descripcion || ''}`)
        .addTo(novedadesLayerRef.current!);
    });
  }, [novedadesVia]);

  // Quebradas (La Yesca & Caraño)
  useEffect(() => {
    if (!cuencasLayerRef.current) return;
    cuencasLayerRef.current.clearLayers();

    cuencas.forEach((c) => {
      const isCritical = c.nivel_riesgo === 'alerta_critica';
      const icon = L.divIcon({
        className: 'cuenca-marker',
        html: `
          <div style="
            background: ${isCritical ? '#ef4444' : '#0284c7'};
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 8px;
            padding: 3px 6px;
            font-size: 10px;
            font-weight: 800;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">
            🌊 ${c.quebrada.replace('_', ' ').toUpperCase()}
          </div>
        `,
        iconSize: [90, 24],
        iconAnchor: [45, 12]
      });

      L.marker([c.lat, c.lng], { icon })
        .bindPopup(`<b>Monitoreo de Cuenca</b><br/>Quebrada: <b>${c.quebrada}</b><br/>Riesgo: <span style="color:${isCritical ? 'red' : 'orange'}">${c.nivel_riesgo}</span><br/>${c.descripcion}`)
        .addTo(cuencasLayerRef.current!);
    });
  }, [cuencas]);

  // Marcador Interactivo de Selección (Predio / Incidencia PQRS)
  useEffect(() => {
    if (!selectedPointLayerRef.current) return;
    selectedPointLayerRef.current.clearLayers();

    if (!selectedPoint) return;

    const color = selectedPoint.color || '#38bdf8';
    const label = selectedPoint.label || 'Ubicación seleccionada';

    const icon = L.divIcon({
      className: 'selected-point-marker',
      html: `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <div style="
            background: ${color};
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 12px;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            border: 2px solid #ffffff;
            margin-bottom: 2px;
          ">
            📍 ${label}
          </div>
          <div style="
            width: 16px;
            height: 16px;
            background: ${color};
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 14px ${color};
          "></div>
        </div>
      `,
      iconSize: [140, 50],
      iconAnchor: [70, 46]
    });

    const marker = L.marker([selectedPoint.lat, selectedPoint.lng], { icon })
      .addTo(selectedPointLayerRef.current);

    marker.bindPopup(`<b>${label}</b><br/>Lat: ${selectedPoint.lat.toFixed(5)}<br/>Lng: ${selectedPoint.lng.toFixed(5)}`);

    const map = mapInstanceRef.current;
    if (map) {
      map.panTo([selectedPoint.lat, selectedPoint.lng], { animate: true, duration: 0.8 });
    }
  }, [selectedPoint]);

  // Heatmap / Puntos Críticos (Alcaldía)
  useEffect(() => {
    if (!heatmapLayerRef.current) return;
    heatmapLayerRef.current.clearLayers();

    if (showHeatmap && heatmapPoints.length > 0) {
      heatmapPoints.forEach((p) => {
        L.circle([p.lat, p.lng], {
          radius: 45,
          fillColor: '#ef4444',
          fillOpacity: 0.55,
          color: '#b91c1c',
          weight: 2
        }).bindPopup('<b>Punto Crítico Reincidente</b><br/>Acumulación de residuos / Foco de comparendo').addTo(heatmapLayerRef.current!);
      });
    }
  }, [showHeatmap, heatmapPoints]);

  // Marcadores de Puntos de Referencia para el Diseñador de Rutas
  useEffect(() => {
    if (!waypointsLayerRef.current) return;
    waypointsLayerRef.current.clearLayers();

    if (customWaypoints && customWaypoints.length > 0) {
      customWaypoints.forEach(([lat, lng], idx) => {
        const icon = L.divIcon({
          className: 'waypoint-pin',
          html: `
            <div style="
              background: #0284c7;
              color: #ffffff;
              border: 2px solid #ffffff;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            ">
              ${idx + 1}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([lat, lng], { icon })
          .bindPopup(`<b>Punto de Ruta #${idx + 1}</b><br/>Quibdó (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
          .addTo(waypointsLayerRef.current!);
      });
    }
  }, [customWaypoints]);

  // Trazado de Ruta por Calles (GeoJSON) con auto-enfoque y puntos de Inicio/Fin
  const routePinsLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (routePinsLayerRef.current) {
      mapInstanceRef.current.removeLayer(routePinsLayerRef.current);
      routePinsLayerRef.current = null;
    }

    const targetGeoJson = routeGeoJson || calculatedRouteGeoJSON;
    if (targetGeoJson) {
      try {
        const routeLayer = L.geoJSON(targetGeoJson, {
          style: {
            color: '#10b981',
            weight: 6,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          }
        }).addTo(mapInstanceRef.current);

        routeLayerRef.current = routeLayer;

        // Auto-centrar y enfocar en el trazado de la ruta
        const bounds = routeLayer.getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        }

        // Extraer coordenadas de inicio y fin para colocar banderines de guía
        const coords = targetGeoJson.coordinates || (targetGeoJson.geometry && targetGeoJson.geometry.coordinates);
        if (Array.isArray(coords) && coords.length >= 2) {
          const startCoord = coords[0];
          const endCoord = coords[coords.length - 1];

          const pinsGroup = L.layerGroup().addTo(mapInstanceRef.current);
          routePinsLayerRef.current = pinsGroup;

          // Marcador de Inicio
          const startIcon = L.divIcon({
            className: 'route-start-marker',
            html: `
              <div style="background: #10b981; color: white; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                <span>🟢 INICIO</span>
              </div>
            `,
            iconSize: [60, 24],
            iconAnchor: [30, 12]
          });
          L.marker([startCoord[1], startCoord[0]], { icon: startIcon })
            .bindPopup('<b>Punto de Partida de Recolección</b><br/>Inicio del trazado oficial')
            .addTo(pinsGroup);

          // Marcador de Fin
          const endIcon = L.divIcon({
            className: 'route-end-marker',
            html: `
              <div style="background: #f59e0b; color: #0b1319; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                <span>🏁 FIN RUTA</span>
              </div>
            `,
            iconSize: [65, 24],
            iconAnchor: [32, 12]
          });
          L.marker([endCoord[1], endCoord[0]], { icon: endIcon })
            .bindPopup('<b>Punto Final de la Micro-Ruta</b><br/>Aquí finaliza la recolección domiciliaria')
            .addTo(pinsGroup);
        }
      } catch (err) {
        console.warn('Error renderizando trazado GeoJSON:', err);
      }
    }
  }, [routeGeoJson, calculatedRouteGeoJSON]);

  // Controles de zoom manuales
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenterQuibdo = () => {
    mapInstanceRef.current?.setView([5.6940, -76.6580], 15);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <div 
        ref={mapContainerRef} 
        className={currentTheme === 'dark' ? 'leaflet-dark-theme' : 'leaflet-light-theme'} 
        style={{ width: '100%', height: '100%' }} 
      />

      {/* Modern Floating Map Controls (Tema, Zoom, Centrar & Modo Mira) */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Botón Alternar Mira Central (Touch Mobile) */}
        {Boolean(onMapClick || onAddPoint) && (
          <button
            type="button"
            onClick={() => setIsCenterTargetActive((prev) => !prev)}
            className="glass-panel eco-mobile-target-only"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: isCenterTargetActive ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
              color: isCenterTargetActive ? '#34d399' : '#94a3b8',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isCenterTargetActive ? '0 0 15px rgba(16, 185, 129, 0.45)' : '0 4px 14px rgba(0,0,0,0.4)',
              background: isCenterTargetActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.92)'
            }}
            title={isCenterTargetActive ? 'Desactivar Mira Central' : 'Activar Mira Central para Ubicar en Móvil'}
          >
            <Crosshair size={18} />
          </button>
        )}

        {/* Botón Modo Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          className="glass-panel"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            color: currentTheme === 'dark' ? '#fbbf24' : '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            background: currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)'
          }}
          title={currentTheme === 'dark' ? 'Cambiar a Mapa Modo Claro' : 'Cambiar a Mapa Modo Oscuro'}
        >
          {currentTheme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#0284c7" />}
        </button>

        <button
          onClick={handleZoomIn}
          className="glass-panel"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            color: '#f8fafc',
            fontSize: '1.2rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Acercar mapa"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="glass-panel"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            color: '#f8fafc',
            fontSize: '1.2rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Alejar mapa"
        >
          -
        </button>
        <button
          onClick={handleRecenterQuibdo}
          className="glass-panel"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            color: '#10b981',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Centrar en Quibdó"
        >
          📍
        </button>
      </div>

      {/* Mira Central Fija para Selección Táctil en Móvil (100% inmune a bugs de touch en iOS) */}
      {isCenterTargetActive && !selectedPoint && (
        <div 
          className="eco-mobile-target-only"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -100%)',
            zIndex: 890,
            pointerEvents: 'none',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'transform 0.15s ease'
          }}
        >
          {/* Píldora de Barrio Cercano Flotante sobre el Pin */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.94)',
            color: '#34d399',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '0.74rem',
            fontWeight: 700,
            border: '1.5px solid #10b981',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.65), 0 0 12px rgba(16, 185, 129, 0.35)',
            whiteSpace: 'nowrap',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <MapPin size={13} color="#10b981" />
            <span>{centerBarrio ? `Barrio ${centerBarrio}` : `${centerCoords.lat.toFixed(4)}, ${centerCoords.lng.toFixed(4)}`}</span>
          </div>

          {/* Ícono de Pin Elevado */}
          <div style={{
            fontSize: '2.6rem',
            lineHeight: 1,
            filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.8))',
            transform: 'translateY(-2px)'
          }}>
            📍
          </div>
          {/* Anillo de Mira en Suelo */}
          <div style={{
            width: '14px',
            height: '7px',
            background: 'rgba(16, 185, 129, 0.5)',
            border: '1.5px solid #34d399',
            borderRadius: '50%',
            marginTop: '-3px'
          }} />
        </div>
      )}

      {/* Barra Flotante Inferior de Fijación (Especial para Mobile / iOS) */}
      {isCenterTargetActive && !selectedPoint && !hideConfirmButton && Boolean(onMapClick || onAddPoint) && (
        <div 
          className="eco-mobile-target-only"
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 920,
            gap: '8px',
            width: 'calc(100% - 32px)',
            maxWidth: '430px',
            animation: 'slideUp 0.3s ease'
          }}
        >
          <button
            type="button"
            onClick={handleConfirmCenterPoint}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '13px 18px',
              fontSize: '0.88rem',
              fontWeight: 800,
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45)',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: '1.5px solid #34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Check size={18} />
            <span>{targetConfirmLabel || 'Fijar este punto aquí'}</span>
          </button>

          <button
            type="button"
            onClick={handleUseGps}
            className="btn btn-secondary"
            style={{
              padding: '13px 15px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.94)',
              border: '1.5px solid rgba(56, 189, 248, 0.5)',
              color: '#38bdf8'
            }}
            title="Ubicar con mi GPS actual"
          >
            <Navigation size={16} />
            <span>Mi GPS</span>
          </button>
        </div>
      )}

    </div>
  );
};
