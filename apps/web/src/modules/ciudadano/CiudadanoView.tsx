import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, 
  Camera, 
  Truck, 
  VolumeX, 
  Volume2, 
  Calendar, 
  Send, 
  Plus, 
  Navigation,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Check,
  Upload,
  Trash2,
  X
} from 'lucide-react';
import { MapComponent } from '../../shared/components/MapComponent.js';
import { api } from '../../shared/services/api.js';
import { socket } from '../../shared/services/socket.js';
import { useAuth } from '../../shared/contexts/AuthContext.js';
import { AmbientalModal } from '../ambiental/AmbientalModal.js';
import { SOCKET_CHANNELS, CategoriaPQRS, AlertaProximidadPayload, COMUNAS_QUIBDO, obtenerBarrioYComunaCercana, COORDENADAS_BARRIOS_QUIBDO } from '@eco-ruta/shared';
import { toast } from 'sonner';

// Helper para encontrar el barrio más cercano a un punto clicado en el mapa
const getBarrioCercano = (lat: number, lng: number): string | null => {
  const res = obtenerBarrioYComunaCercana(lat, lng, 1200);
  return res ? res.barrio : null;
};


interface CiudadanoViewProps {
  isPublic?: boolean;
  onOpenAuth?: () => void;
}

// Generador de audio y vibración táctil para alertas móviles sin bloqueo de autoplay
let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

const playAlertChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const now = ctx.currentTime;
    // Campana cívica armoniosa en 2 tiempos (880Hz La5 -> 1320Hz Mi6)
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  } catch (e) {
    console.warn('Audio chime warning:', e);
  }
};

export const CiudadanoView: React.FC<CiudadanoViewProps> = ({ isPublic = false, onOpenAuth }) => {
  const { user } = useAuth();

  // Catálogos
  const [rutas, setRutas] = useState<any[]>([]);
  const [selectedRutaId, setSelectedRutaId] = useState<string>('');
  const [currentRuta, setCurrentRuta] = useState<any | null>(null);
  const [puntosAcopio, setPuntosAcopio] = useState<any[]>([]);

  // Telemetría en vivo estilo Uber
  const [truckPos, setTruckPos] = useState<any | null>(null);
  const [historialPuntos, setHistorialPuntos] = useState<[number, number][]>([]);

  // Inmuebles privados del usuario (hasta 3: Casa, Local Comercial, etc.)
  const [inmuebles, setInmuebles] = useState<any[]>([]);
  const [selectedInmuebleId, setSelectedInmuebleId] = useState<string>('');
  const [showInmuebleModal, setShowInmuebleModal] = useState(false);
  const [nuevoInmuebleEtiqueta, setNuevoInmuebleEtiqueta] = useState('');
  const [nuevoInmuebleDireccion, setNuevoInmuebleDireccion] = useState('');
  const [nuevoInmuebleCoords, setNuevoInmuebleCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBarrioInmueble, setSelectedBarrioInmueble] = useState('');
  const [nuevoInmueblePreaviso, setNuevoInmueblePreaviso] = useState(10);
  const [isSubmittingInmueble, setIsSubmittingInmueble] = useState(false);

  // Silenciador de alertas
  const [alertaSilenciada, setAlertaSilenciada] = useState(false);

  // Deduplicación de alertas por hito para evitar spam
  const notifiedMilestonesRef = useRef<Set<string>>(new Set());

  // Bandeja de PQRS y Modal de Reporte Cívico
  const [misPqrs, setMisPqrs] = useState<any[]>([]);
  const [showPqrsModal, setShowPqrsModal] = useState(false);
  const [tipoPqrs, setTipoPqrs] = useState<CategoriaPQRS>(CategoriaPQRS.CAMION_NO_PASO);
  const [descripcionPqrs, setDescripcionPqrs] = useState('');
  const [fotoBase64, setFotoBase64] = useState<string>('');
  const [pqrsCoords, setPqrsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBarrioPqrs, setSelectedBarrioPqrs] = useState('');
  const [isSubmittingPqrs, setIsSubmittingPqrs] = useState(false);

  // Punto seleccionado interactivamente al tocar/hacer clic en el mapa (Móvil y Web)
  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number; barrio?: string } | null>(null);

  // Modal Ambiental / Cuencas
  const [showAmbientalModal, setShowAmbientalModal] = useState(false);
  const [showItinerarioModal, setShowItinerarioModal] = useState(false);
  const [showHorariosModal, setShowHorariosModal] = useState(false);

  // Visibilidad del menú / tarjeta inferior flotante
  const [isBottomCardCollapsed, setIsBottomCardCollapsed] = useState(false);

  // Escuchar eventos de apertura desde el menú lateral
  useEffect(() => {
    const handleOpenModal = (e: any) => {
      const modal = e.detail;
      if (modal === 'mapa') setIsBottomCardCollapsed(false);
      if (modal === 'predios') setShowInmuebleModal(true);
      if (modal === 'pqrs') setShowPqrsModal(true);
      if (modal === 'horarios') setShowHorariosModal(true);
      if (modal === 'itinerario') setShowItinerarioModal(true);
      if (modal === 'ambiental') setShowAmbientalModal(true);
    };

    window.addEventListener('eco:open-modal', handleOpenModal);
    return () => window.removeEventListener('eco:open-modal', handleOpenModal);
  }, []);

  // Habilitar audio en navegadores móviles con el primer gesto táctil
  useEffect(() => {
    const unlockAudio = () => {
      getAudioContext();
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  // Inmueble activo enfocado para alertas y distancias
  const activeInmueble = useMemo(() => {
    if (inmuebles.length === 0) return null;
    return inmuebles.find((i) => i.id === selectedInmuebleId) || inmuebles[0];
  }, [inmuebles, selectedInmuebleId]);

  // Validar si el punto clicado está cerca o coincide con un predio del usuario
  const inmuebleCercanoAlPunto = useMemo(() => {
    if (!clickedPoint || inmuebles.length === 0) return null;
    return inmuebles.find((inm) => {
      const dLat = (inm.lat - clickedPoint.lat) * 111000;
      const dLng = (inm.lng - clickedPoint.lng) * 111000 * Math.cos((clickedPoint.lat * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      return dist <= 60; // a menos de 60 metros
    });
  }, [clickedPoint, inmuebles]);

  // Si hay cualquier drawer o modal lateral/inferior abierto
  const isAnyDrawerOpen = Boolean(clickedPoint || showInmuebleModal || showPqrsModal);

  // Centro dinámico del mapa (enfoca en el predio activo o centro de Quibdó)
  const mapCenter: [number, number] = useMemo(() => {
    if (activeInmueble) return [activeInmueble.lat, activeInmueble.lng];
    return [5.6940, -76.6580];
  }, [activeInmueble]);

  // Cálculo en vivo estilo Uber de tiempo restante y distancia al predio seleccionado
  const etaInfo = useMemo(() => {
    if (!truckPos || !activeInmueble) return null;

    const R = 6371e3; // metros
    const lat1 = (truckPos.lat * Math.PI) / 180;
    const lat2 = (activeInmueble.lat * Math.PI) / 180;
    const dLat = ((activeInmueble.lat - truckPos.lat) * Math.PI) / 180;
    const dLng = ((activeInmueble.lng - truckPos.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMetros = Math.round(R * c);

    const vel = truckPos.velocidad > 5 ? truckPos.velocidad : 15;
    const minEstimados = Math.max(1, Math.round(distMetros / ((vel * 1000) / 60)));

    let status = 'EN_CAMINO';
    let label = `Llega en ~${minEstimados} min`;
    let color = '#34d399';
    let bg = 'rgba(16, 185, 129, 0.22)';
    let border = 'rgba(16, 185, 129, 0.45)';

    if (distMetros <= 100) {
      status = 'LLEGADA';
      label = '¡En tu calle / cuadra ahora!';
      color = '#38bdf8';
      bg = 'rgba(56, 189, 248, 0.25)';
      border = 'rgba(56, 189, 248, 0.6)';
    } else if (minEstimados <= 5 || distMetros <= 450) {
      status = 'ALISTATE';
      label = `¡Alístate! Llega en ~${minEstimados} min`;
      color = '#fbbf24';
      bg = 'rgba(245, 158, 11, 0.25)';
      border = 'rgba(245, 158, 11, 0.6)';
    }

    return {
      distancia: distMetros,
      minutos: minEstimados,
      status,
      label,
      color,
      bg,
      border,
      predio: activeInmueble.etiqueta
    };
  }, [truckPos, activeInmueble]);

  // Cargar catálogo de datos para Quibdó
  const loadData = async () => {
    try {
      const [resRutas, resInmuebles, resPqrs] = await Promise.all([
        api.getRutas(),
        isPublic ? Promise.resolve({ data: [] }) : api.getInmuebles(user?.id),
        isPublic ? Promise.resolve({ data: [] }) : api.getPqrs(user?.id)
      ]);

      setRutas(resRutas.data);
      setInmuebles(resInmuebles.data);
      setMisPqrs(resPqrs.data);

      if (resInmuebles.data.length > 0 && !selectedInmuebleId) {
        setSelectedInmuebleId(resInmuebles.data[0].id);
        if (resInmuebles.data[0].ruta_id) {
          setSelectedRutaId(resInmuebles.data[0].ruta_id);
        }
      } else if (resRutas.data.length > 0 && !selectedRutaId) {
        setSelectedRutaId(resRutas.data[0].id);
        setCurrentRuta(resRutas.data[0]);
      }
    } catch (err: any) {
      console.error('Error cargando datos cívicos:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isPublic]);

  // Cargar puntos de acopio de la ruta seleccionada y cambiar currentRuta
  useEffect(() => {
    if (!selectedRutaId) return;
    const r = rutas.find((item) => item.id === selectedRutaId);
    if (r) setCurrentRuta(r);

    // Limpiar posición previa al cambiar de micro-ruta
    setTruckPos(null);
    setHistorialPuntos([]);

    api.getPuntosAcopio(selectedRutaId).then((res) => {
      setPuntosAcopio(res.data);
    });

    // Consultar si ya existe un turno activo en esta ruta
    api.getTurnosActivos().then((res) => {
      const active = res.data?.find((t: any) => t.ruta_id === selectedRutaId && t.estado === 'activo');
      if (active && active.lat && active.lng) {
        setTruckPos({
          lat: active.lat,
          lng: active.lng,
          velocidad: active.velocidad || 18,
          rumbo: active.rumbo || 45,
          placa: active.vehiculo_codigo || active.vehiculo_placa || 'COMP-01',
          avance: 15
        });
        setHistorialPuntos([[active.lat, active.lng]]);
      }
    });

    // Suscribirse vía WebSocket a la ruta en vivo
    socket.emit(SOCKET_CHANNELS.UNIRSE_RUTA, selectedRutaId);

    const handleTelemetria = (data: any) => {
      if (data.ruta_id && data.ruta_id !== selectedRutaId) return;
      setTruckPos({
        lat: data.lat,
        lng: data.lng,
        rumbo: data.rumbo_grados,
        velocidad: data.velocidad_kmh,
        placa: data.vehiculo_id,
        avance: data.porcentaje_avance
      });
      setHistorialPuntos((prev) => [...prev, [data.lat, data.lng]]);
    };

    const handleAlerta = (data: AlertaProximidadPayload & { hito?: string; usuario_id?: string }) => {
      if (alertaSilenciada || isPublic) return;

      // Alerta individual: si el usuario tiene sesión, solo alertar sobre sus propios predios
      if (user?.id && data.usuario_id && data.usuario_id !== user.id) return;

      // Deduplicar hito por ciclo de turno para evitar spam
      const hitoKey = `${selectedRutaId}_${data.inmueble_id}_${data.hito || data.tiempo_estimado_minutos}`;
      if (notifiedMilestonesRef.current.has(hitoKey)) return;
      notifiedMilestonesRef.current.add(hitoKey);

      // Sonido y vibración táctil para móviles (sin bloqueo)
      playAlertChime();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([280, 90, 280]);
        } catch (_) {}
      }

      // Disparar Sonner Toast elegante con botón individual y botón masivo
      const titulo = data.hito === 'LLEGADA' 
        ? `🚛 ¡Llegada a tu cuadra! (${data.inmueble_etiqueta})` 
        : data.hito === '5_MIN' 
        ? `⏳ ¡Faltan ~5 minutos! (${data.inmueble_etiqueta})` 
        : `🔔 Camión aproximándose (${data.inmueble_etiqueta})`;

      toast.warning(titulo, {
        description: data.mensaje,
        duration: 7000,
        action: {
          label: 'Cerrar todas',
          onClick: () => toast.dismiss()
        },
        cancel: {
          label: 'Silenciar',
          onClick: () => handleToggleSilenciarAlertas()
        }
      });
    };

    const handleTurnoCambio = (payload: any) => {
      if (payload.turno?.ruta_id === selectedRutaId) {
        if (payload.tipo === 'finalizacion' || payload.tipo === 'finalizacion_ciudadano') {
          setTruckPos(null);
          setHistorialPuntos([]);
          toast.info('🚛 El compactador ha completado su recolección en esta ruta y finalizó su recorrido.');
        } else if (payload.tipo === 'inicio') {
          toast.success('🚛 ¡El compactador inició su turno en esta ruta!');
        }
      }
    };

    socket.on(SOCKET_CHANNELS.TELEMETRIA_ACTUALIZACION, handleTelemetria);
    socket.on(SOCKET_CHANNELS.ALERTA_PROXIMIDAD, handleAlerta);
    socket.on(SOCKET_CHANNELS.TURNO_CAMBIO_ESTADO, handleTurnoCambio);

    return () => {
      socket.emit(SOCKET_CHANNELS.DEJAR_RUTA, selectedRutaId);
      socket.off(SOCKET_CHANNELS.TELEMETRIA_ACTUALIZACION, handleTelemetria);
      socket.off(SOCKET_CHANNELS.ALERTA_PROXIMIDAD, handleAlerta);
      socket.off(SOCKET_CHANNELS.TURNO_CAMBIO_ESTADO, handleTurnoCambio);
    };
  }, [selectedRutaId, rutas, alertaSilenciada, isPublic, user]);

  // Obtener geolocalización satelital del dispositivo móvil/pc
  const handleUsarGpsActual = (target: 'inmueble' | 'pqrs') => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Tu navegador o dispositivo no soporta geolocalización GPS.');
      return;
    }
    toast.loading('Obteniendo tu ubicación satelital GPS en Quibdó...', { id: 'gps-loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('gps-loading');
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (target === 'inmueble') {
          setNuevoInmuebleCoords({ lat, lng });
          toast.success(`📍 Ubicación GPS fijada: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } else {
          setPqrsCoords({ lat, lng });
          toast.success(`📍 Ubicación GPS fijada: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      },
      () => {
        toast.dismiss('gps-loading');
        toast.error('No se pudo acceder al GPS. Verifica los permisos de ubicación o selecciona tu barrio en la lista.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Selección rápida por barrio de Quibdó
  const handleSelectBarrio = (barrioNombre: string, target: 'inmueble' | 'pqrs') => {
    const coords = COORDENADAS_BARRIOS_QUIBDO[barrioNombre];
    if (target === 'inmueble') {
      setSelectedBarrioInmueble(barrioNombre);
      if (coords) {
        setNuevoInmuebleCoords(coords);
        toast.success(`📍 Ubicación fijada en Barrio ${barrioNombre}`);
      }
    } else {
      setSelectedBarrioPqrs(barrioNombre);
      if (coords) {
        setPqrsCoords(coords);
        toast.success(`📍 Ubicación fijada en Barrio ${barrioNombre}`);
      }
    }
  };

  // Carga de fotografía desde cámara o galería para PQRS
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La fotografía no debe superar 5MB de tamaño.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFotoBase64(reader.result as string);
      toast.success('📷 Fotografía cargada correctamente');
    };
    reader.readAsDataURL(file);
  };

  // Click interactivo en el mapa Leaflet (Móvil y Web)
  const handleMapClick = (lat: number, lng: number) => {
    const barrio = getBarrioCercano(lat, lng) || undefined;
    const point = { lat, lng, barrio };

    // Si el modal de predio está abierto, actualizar sus datos directamente
    if (showInmuebleModal) {
      setNuevoInmuebleCoords({ lat, lng });
      if (barrio && !selectedBarrioInmueble) setSelectedBarrioInmueble(barrio);
      toast.success(`📍 Predio fijado en ${barrio ? `Barrio ${barrio}` : 'mapa'}: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      return;
    }

    // Si el modal de PQRS está abierto, actualizar sus datos directamente
    if (showPqrsModal) {
      setPqrsCoords({ lat, lng });
      if (barrio && !selectedBarrioPqrs) setSelectedBarrioPqrs(barrio);
      toast.success(`📍 Incidencia fijada en ${barrio ? `Barrio ${barrio}` : 'mapa'}: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      return;
    }

    // Punto nuevo marcado en el mapa (Web y Móvil): mostrar opciones y fijar pin
    setClickedPoint(point);
    setIsBottomCardCollapsed(true); // Ocultar panel de recolección para dejar ver las opciones

    // Vibración táctil háptica en móviles
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch (_) {}
    }
  };

  // Alternar Silenciar / Reactivar Alertas
  const handleToggleSilenciarAlertas = async (inmuebleId?: string) => {
    if (alertaSilenciada) {
      setAlertaSilenciada(false);
      notifiedMilestonesRef.current.clear();
      toast.success('🔔 ¡Alarmas y alertas sonoras reactivadas!', {
        description: 'Recibirás avisos de aproximación en tiempo real cuando el compactador esté cerca.',
      });
    } else {
      setAlertaSilenciada(true);
      toast.info('🔕 Alertas silenciadas temporalmente.', {
        description: 'Puedes reactivarlas en cualquier momento con el botón "Activar Alarma".',
      });
      if (inmuebleId) {
        await api.silenciarInmueble(inmuebleId, 12);
      }
    }
  };

  // Guardar Inmueble Privado (Máx 3)
  const handleGuardarInmueble = async () => {
    if (isPublic || !user) {
      toast.info('Debes iniciar sesión para vincular y registrar un predio privado.');
      onOpenAuth?.();
      return;
    }
    if (!nuevoInmuebleEtiqueta.trim() || !nuevoInmuebleCoords) {
      toast.error('Ingresa un nombre y define la ubicación (usa GPS, elige tu barrio o toca en el mapa).');
      return;
    }
    if (inmuebles.length >= 3) {
      toast.error('Ya tienes el máximo de 3 predios privados registrados.');
      return;
    }

    setIsSubmittingInmueble(true);
    try {
      const res = await api.crearInmueble({
        usuario_id: user.id,
        etiqueta: nuevoInmuebleEtiqueta.trim(),
        lat: nuevoInmuebleCoords.lat,
        lng: nuevoInmuebleCoords.lng,
        direccion: nuevoInmuebleDireccion.trim() || undefined,
        ruta_id: selectedRutaId || undefined,
        minutos_preaviso: nuevoInmueblePreaviso
      });
      setInmuebles((prev) => [res.data, ...prev]);
      setSelectedInmuebleId(res.data.id);
      setShowInmuebleModal(false);
      setNuevoInmuebleEtiqueta('');
      setNuevoInmuebleDireccion('');
      setSelectedBarrioInmueble('');
      setNuevoInmuebleCoords(null);
      setClickedPoint(null);
      toast.success('🎉 ¡Inmueble privado registrado con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar inmueble');
    } finally {
      setIsSubmittingInmueble(false);
    }
  };

  // Enviar Reporte Cívico Fotográfico (PQRS)
  const handleEnviarPqrs = async () => {
    if (isPublic || !user) {
      toast.info('Debes iniciar sesión para enviar un reporte cívico oficial.');
      onOpenAuth?.();
      return;
    }
    if (!descripcionPqrs.trim() || !pqrsCoords) {
      toast.error('Por favor escribe la descripción y fija el punto en Quibdó (GPS, Barrio o Mapa).');
      return;
    }

    setIsSubmittingPqrs(true);
    try {
      const res = await api.crearPqrs({
        tipo_incidencia: tipoPqrs,
        descripcion: descripcionPqrs.trim(),
        lat: pqrsCoords.lat,
        lng: pqrsCoords.lng,
        foto_base64: fotoBase64 || undefined,
        usuario_id: user.id
      });
      if (res.data) {
        setMisPqrs((prev) => [res.data, ...prev]);
      }
      setShowPqrsModal(false);
      setDescripcionPqrs('');
      setFotoBase64('');
      setPqrsCoords(null);
      setSelectedBarrioPqrs('');
      setClickedPoint(null);
      toast.success('✅ ¡Reporte cívico enviado a Aguas del Atrato!', {
        description: 'La cuadrilla y supervisores de ruta han recibido las coordenadas de la anomalía.'
      });
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar reporte');
    } finally {
      setIsSubmittingPqrs(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 66px)', overflow: 'hidden' }}>
      {/* Tarjeta de Acciones sobre el Punto Seleccionado (Lateral en PC, Bottom-Sheet en Móvil) */}
      {clickedPoint && !showInmuebleModal && !showPqrsModal && (
        <div className="eco-floating-drawer glass-panel" style={{
          padding: '18px 20px',
          background: 'rgba(11, 19, 25, 0.98)',
          border: '1.5px solid rgba(16, 185, 129, 0.55)',
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(16, 185, 129, 0.25)'
        }}>
          {/* Cabecera con Nombre de Barrio y Botón Cerrar */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MapPin size={18} color="#34d399" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                  {clickedPoint.barrio ? `Barrio ${clickedPoint.barrio}` : 'Ubicación en Quibdó'}
                </h4>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  GPS: {clickedPoint.lat.toFixed(5)}, {clickedPoint.lng.toFixed(5)}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setClickedPoint(null);
                setIsBottomCardCollapsed(false);
              }}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              title="Cerrar y desmarcar punto"
            >
              <X size={20} />
            </button>
          </div>

          {/* Información y Validaciones Contextuales */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '14px',
            fontSize: '0.77rem'
          }}>
            {inmuebleCercanoAlPunto ? (
              <div style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={15} color="#38bdf8" />
                <span>Aquí tienes registrado tu predio: <b>{inmuebleCercanoAlPunto.etiqueta}</b></span>
              </div>
            ) : isPublic || !user ? (
              <div style={{ color: '#fbbf24' }}>
                ℹ️ <b>Modo Consulta:</b> Inicia sesión para vincular alertas de tu predio o radicar PQRS oficial.
              </div>
            ) : (
              <div style={{ color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Predios registrados en tu cuenta:</span>
                <span style={{ fontWeight: 800, color: inmuebles.length >= 3 ? '#ef4444' : '#34d399' }}>
                  {inmuebles.length} / 3
                </span>
              </div>
            )}
          </div>

          {/* Botones de Acción Inmediata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => {
                if (isPublic || !user) {
                  toast.info('Debes iniciar sesión para vincular y registrar un predio privado.');
                  onOpenAuth?.();
                  return;
                }
                if (inmuebles.length >= 3) {
                  toast.error('Ya tienes el cupo máximo de 3 predios registrados.');
                  return;
                }
                setNuevoInmuebleCoords({ lat: clickedPoint.lat, lng: clickedPoint.lng });
                if (clickedPoint.barrio) setSelectedBarrioInmueble(clickedPoint.barrio);
                setShowInmuebleModal(true);
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
              }}
            >
              <MapPin size={16} />
              <span>Registrar como Mi Predio Privado</span>
            </button>

            <button
              onClick={() => {
                if (isPublic || !user) {
                  toast.info('Debes iniciar sesión para enviar un reporte cívico oficial.');
                  onOpenAuth?.();
                  return;
                }
                setPqrsCoords({ lat: clickedPoint.lat, lng: clickedPoint.lng });
                if (clickedPoint.barrio) setSelectedBarrioPqrs(clickedPoint.barrio);
                setShowPqrsModal(true);
              }}
              className="btn btn-danger"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Camera size={16} />
              <span>Reportar Incidencia o Basuras (PQRS)</span>
            </button>

            <button
              onClick={() => {
                setClickedPoint(null);
                setIsBottomCardCollapsed(false);
              }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '7px 12px', fontSize: '0.76rem', color: '#94a3b8' }}
            >
              Desmarcar Punto
            </button>
          </div>
        </div>
      )}

      {/* Indicador Flotante Modo Público (Sin Sesión) */}
      {isPublic && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(11, 19, 25, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          padding: '6px 12px',
          borderRadius: '20px',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5)',
          maxWidth: 'calc(100vw - 110px)'
        }}>
          <span style={{ fontSize: '0.85rem' }}>🌐</span>
          <span style={{ fontSize: '0.74rem', color: '#f8fafc', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Portal Ciudadano Quibdó
          </span>
          <button
            onClick={onOpenAuth}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: 'none',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
            }}
          >
            Ingresar
          </button>
        </div>
      )}

      {/* Mapa Principal: Ocupa el 100% de la pantalla (Mobile y Desktop) */}
      <MapComponent
        center={mapCenter}
        truck={truckPos}
        historialPuntos={historialPuntos}
        showBreadcrumbs={false}
        routeGeoJson={currentRuta?.trazado_geojson}
        inmuebles={isPublic ? [] : inmuebles}
        puntosAcopio={puntosAcopio}
        selectedPoint={
          showInmuebleModal && nuevoInmuebleCoords
            ? { ...nuevoInmuebleCoords, label: nuevoInmuebleEtiqueta || (selectedBarrioInmueble ? `Predio: ${selectedBarrioInmueble}` : 'Mi Predio'), color: '#38bdf8' }
            : (showPqrsModal && pqrsCoords
                ? { ...pqrsCoords, label: 'Incidencia PQRS', color: '#ef4444' }
                : (clickedPoint
                    ? { ...clickedPoint, label: clickedPoint.barrio ? `Barrio ${clickedPoint.barrio}` : 'Punto Marcado', color: '#10b981' }
                    : null))
        }
        onMapClick={handleMapClick}
        height="100%"
        enableCenterTarget={!isAnyDrawerOpen}
        hideConfirmButton={isAnyDrawerOpen || !isBottomCardCollapsed}
        targetConfirmLabel="Fijar este punto en Quibdó"
      />

      {/* InDrive-Style Core Floating Card (Se oculta si hay un panel de acción o formulario abierto) */}
      {!isAnyDrawerOpen && (isBottomCardCollapsed ? (
        /* Botón flotante píldora para volver a mostrar el panel */
        <button
          onClick={() => {
            setIsBottomCardCollapsed(false);
            toast.success('Panel de ruta y recolección visible.');
          }}
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 950,
            borderRadius: '30px',
            padding: '8px 18px',
            background: 'rgba(11, 19, 25, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 16px rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            color: '#f8fafc',
            fontSize: '0.82rem',
            fontWeight: 700,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          title="Toca para mostrar panel de ruta y recolección"
        >
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '8px',
            background: truckPos ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Truck size={15} color={truckPos ? '#34d399' : '#94a3b8'} />
          </div>
          <span style={{ color: etaInfo ? etaInfo.color : (truckPos ? '#34d399' : '#f8fafc') }}>
            {etaInfo ? etaInfo.label : (truckPos ? `Compactador (${truckPos.velocidad} km/h)` : 'Ver Panel de Recolección')}
          </span>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ChevronUp size={14} color="#34d399" />
          </div>
        </button>
      ) : (
        <div
          className="indrive-bottom-card"
          style={{
            position: 'absolute',
            bottom: '14px',
            left: '12px',
            right: '12px',
            maxWidth: '520px',
            margin: '0 auto',
            background: 'rgba(11, 19, 25, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '18px',
            zIndex: 950,
            boxShadow: '0 10px 35px rgba(0, 0, 0, 0.65)',
            padding: '10px 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Barra Tirador Táctil Superior (Tap para Colapsar) */}
          <div
            onClick={() => {
              setIsBottomCardCollapsed(true);
              toast.info('Panel de ruta oculto. Toca el botón flotante inferior para reabrirlo.');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 0 4px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            title="Toca para ocultar panel y ver el mapa completo"
          >
            <div style={{
              width: '42px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.25)',
              transition: 'background 0.2s ease'
            }} />
          </div>

          {/* Fila 1: Estado del Camión & ETA en Vivo (Core que le interesa al ciudadano) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '42px',
                height: '42px',
                minWidth: '42px',
                borderRadius: '12px',
                background: truckPos ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${truckPos ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Truck size={22} color={truckPos ? '#34d399' : '#64748b'} />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: etaInfo ? etaInfo.color : (truckPos ? '#34d399' : '#f8fafc'),
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {truckPos && <span className="pulse-dot" style={{ width: '8px', height: '8px', backgroundColor: etaInfo ? etaInfo.color : '#34d399' }} />}
                  <span>
                    {etaInfo 
                      ? etaInfo.label 
                      : (truckPos ? `Compactador en ruta (${truckPos.velocidad} km/h)` : 'Esperando compactador en ruta...')}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {activeInmueble 
                    ? `Destino: ${activeInmueble.etiqueta} • ${currentRuta?.comuna || 'Quibdó'}`
                    : (currentRuta ? `${currentRuta.nombre}` : 'Quibdó, Chocó')}
                </div>
              </div>
            </div>

            {/* Controles: Silenciar Alarma y Botón Ocultar Panel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {/* Botón Silenciar / Reactivar Rápido */}
              <button
                onClick={() => handleToggleSilenciarAlertas()}
                className={`btn ${alertaSilenciada ? 'btn-warning' : 'btn-secondary'}`}
                style={{ 
                  padding: '6px 10px', 
                  fontSize: '0.72rem', 
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  border: alertaSilenciada ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.15)',
                  background: alertaSilenciada ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.06)'
                }}
                title={alertaSilenciada ? "Toca para reactivar alarmas y avisos sonoros de aproximación" : "Silenciar alarmas temporalmente"}
              >
                {alertaSilenciada ? (
                  <>
                    <Volume2 size={13} color="#f59e0b" />
                    <span style={{ color: '#f59e0b' }}>Activar Alarma</span>
                  </>
                ) : (
                  <>
                    <VolumeX size={13} />
                    <span>Silenciar</span>
                  </>
                )}
              </button>

              {/* Botón Minimizar / Ocultar Panel */}
              <button
                onClick={() => {
                  setIsBottomCardCollapsed(true);
                  toast.info('Panel de ruta oculto. Toca el botón flotante inferior para reabrirlo cuando desees.');
                }}
                className="btn btn-secondary"
                style={{
                  padding: '6px 8px',
                  fontSize: '0.72rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Ocultar menú para ver mapa completo"
                aria-label="Ocultar panel"
              >
                <ChevronDown size={14} />
                <span className="hide-mobile">Ocultar</span>
              </button>
            </div>
          </div>

          {/* Fila 2: Selector de Micro-Ruta (Amplio, sin desbordamiento) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                MICRO-RUTA ACTIVA:
              </span>
              {currentRuta && (
                <span style={{ fontSize: '0.66rem', color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  {currentRuta.comuna}
                </span>
              )}
            </div>
            {rutas.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                ℹ️ Sin micro-rutas registradas aún. Puedes fijar tu predio familiar en el mapa de Quibdó para recibir alertas sonoras apenas el camión inicie marcha.
              </div>
            ) : (
              <select
                className="input-control"
                style={{
                  width: '100%',
                  fontSize: '0.82rem',
                  padding: '7px 10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  textOverflow: 'ellipsis'
                }}
                value={selectedRutaId}
                onChange={(e) => {
                  setSelectedRutaId(e.target.value);
                  const r = rutas.find((item) => item.id === e.target.value);
                  if (r) toast.info(`Ruta seleccionada: ${r.nombre}`);
                }}
              >
                {rutas.map((r) => (
                  <option key={r.id} value={r.id} style={{ background: '#0b1319', color: '#f8fafc' }}>
                    {r.nombre} ({r.comuna})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fila 3: Selector de Predios Rápidos (si el ciudadano tiene predios) */}
          {!isPublic && inmuebles.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingTop: '2px'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>Predio:</span>
              {inmuebles.map((inm) => {
                const isSelected = inm.id === activeInmueble?.id;
                return (
                  <button
                    key={inm.id}
                    onClick={() => {
                      setSelectedInmuebleId(inm.id);
                      if (inm.ruta_id) {
                        setSelectedRutaId(inm.ruta_id);
                      }
                      toast.info(`📍 Enfocado en: ${inm.etiqueta}`);
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: isSelected ? 800 : 500,
                      borderRadius: '16px',
                      border: isSelected ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelected ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🏠 {inm.etiqueta}</span>
                    {isSelected && <span style={{ fontSize: '0.65rem' }}>✓</span>}
                  </button>
                );
              })}

              {inmuebles.length < 3 && (
                <button
                  onClick={() => setShowInmuebleModal(true)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    borderRadius: '16px',
                    border: '1px dashed rgba(56, 189, 248, 0.6)',
                    background: 'rgba(56, 189, 248, 0.08)',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={12} />
                  <span>+ Predio</span>
                </button>
              )}
            </div>
          )}

          {/* Fila 4: Accesos Rápidos a Servicios */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '8px',
            marginTop: '2px'
          }}>
            <button
              onClick={() => setShowPqrsModal(true)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}
            >
              <Camera size={13} color="#ef4444" />
              <span>Reportar PQRS {misPqrs.length > 0 ? `(${misPqrs.length})` : ''}</span>
            </button>

            <button
              onClick={() => setShowHorariosModal(true)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#7dd3fc' }}
            >
              <Calendar size={13} color="#38bdf8" />
              <span>Ver Horarios</span>
            </button>

            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              Más en menú ☰
            </span>
          </div>
        </div>
      ))}

      {/* Modal Registrar Inmueble (Panel flotante: lateral en PC, bottom-sheet en Móvil) */}
      {showInmuebleModal && (
        <div className="eco-floating-drawer glass-panel" style={{
          padding: '20px',
          background: 'rgba(11, 19, 25, 0.98)',
          border: '1.5px solid rgba(56, 189, 248, 0.55)',
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(56, 189, 248, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
              <MapPin size={20} /> Registrar Mi Predio Privado
            </h3>
            <button
              type="button"
              onClick={() => setShowInmuebleModal(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
              Fija tu casa, negocio o predio familiar en Quibdó para recibir alertas sonoras de aproximación del compactador.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>
                Nombre o Etiqueta: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Casa Familiar / Local Comercial / Mi Negocio"
                className="input-control"
                value={nuevoInmuebleEtiqueta}
                onChange={(e) => setNuevoInmuebleEtiqueta(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>
                Dirección o Referencia:
              </label>
              <input
                type="text"
                placeholder="Ej. Cra 5 # 24-18 frente al parque / Barrio Roma"
                className="input-control"
                value={nuevoInmuebleDireccion}
                onChange={(e) => setNuevoInmuebleDireccion(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>
                Margen de Preaviso Deseado:
              </label>
              <select
                className="input-control"
                value={nuevoInmueblePreaviso}
                onChange={(e) => setNuevoInmueblePreaviso(Number(e.target.value))}
              >
                <option value={5}>5 Minutos de anticipación</option>
                <option value={10}>10 Minutos de anticipación (Recomendado)</option>
                <option value={15}>15 Minutos de anticipación</option>
              </select>
            </div>

            {/* SELECCIÓN DE UBICACIÓN (3 OPCIONES RÁPIDAS) */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
                📍 Ubicación Geográfica en Quibdó:
              </label>

              {/* Botón GPS y Botón Mapa */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleUsarGpsActual('inmueble')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 10px' }}
                >
                  <Crosshair size={15} color="#38bdf8" />
                  <span>Usar GPS Celular</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.info('👆 Toca directamente en cualquier calle o esquina del mapa para clavar el pin de tu predio.');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 10px' }}
                >
                  <MapPin size={15} color="#10b981" />
                  <span>Tocar en el Mapa</span>
                </button>
              </div>

              {/* Selector por Barrio de Quibdó */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '0.73rem', color: '#94a3b8', marginBottom: '4px' }}>
                  O selecciona tu barrio o sector de Quibdó:
                </label>
                <select
                  className="input-control"
                  style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                  value={selectedBarrioInmueble}
                  onChange={(e) => handleSelectBarrio(e.target.value, 'inmueble')}
                >
                  <option value="">-- Elige tu barrio / sector --</option>
                  {COMUNAS_QUIBDO.map((c) => (
                    <optgroup key={c.id} label={`${c.nombre} (${c.tipo})`}>
                      {c.barrios.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Estado de Coordenadas */}
              {nuevoInmuebleCoords ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginTop: '8px',
                  color: '#34d399',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} />
                    <span>Punto Fijado: {nuevoInmuebleCoords.lat.toFixed(4)}, {nuevoInmuebleCoords.lng.toFixed(4)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNuevoInmuebleCoords(null);
                      setSelectedBarrioInmueble('');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}
                  >
                    Borrar
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.73rem', color: '#f59e0b', marginTop: '6px' }}>
                  ⚠️ Usa el botón GPS, el selector de barrios o toca en el mapa para fijar tu predio.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowInmuebleModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarInmueble}
                disabled={isSubmittingInmueble}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isSubmittingInmueble ? 'Guardando...' : 'Guardar Mi Predio'}
              </button>
            </div>
        </div>
      )}

      {/* Modal Reportar PQRS (Panel flotante: lateral en PC, bottom-sheet en Móvil) */}
      {showPqrsModal && (
        <div className="eco-floating-drawer glass-panel" style={{
          padding: '20px',
          background: 'rgba(11, 19, 25, 0.98)',
          border: '1.5px solid rgba(239, 68, 68, 0.55)',
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(239, 68, 68, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
              <Camera size={20} /> Reporte Fotográfico Cívico (PQRS)
            </h3>
            <button
              type="button"
              onClick={() => setShowPqrsModal(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
              Reporta anomalías de aseo en Quibdó (botaderos, escombros, camión que no pasó) directamente al equipo de despacho.
            </p>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>
                Tipo de Incidencia: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                className="input-control"
                value={tipoPqrs}
                onChange={(e: any) => setTipoPqrs(e.target.value)}
              >
                <option value={CategoriaPQRS.CAMION_NO_PASO}>🚛 Camión no pasó por la cuadra</option>
                <option value={CategoriaPQRS.PUNTO_CRITICO}>⚠️ Punto crítico de basuras / Botadero clandestino</option>
                <option value={CategoriaPQRS.BASURA_DISPERSA}>🐕 Basura dispersa o bolsas rotas</option>
                <option value={CategoriaPQRS.ESCOMBROS_CLANDESTINOS}>🧱 Escombros arrojados en vía pública</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>
                Descripción de la Situación: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="input-control"
                rows={3}
                placeholder="Describe la esquina exacta, cantidad de basura o problema observado en el sector..."
                value={descripcionPqrs}
                onChange={(e) => setDescripcionPqrs(e.target.value)}
              />
            </div>

            {/* SELECCIÓN DE UBICACIÓN (3 OPCIONES) */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '14px'
            }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#f87171', marginBottom: '8px' }}>
                📍 Ubicación de la Anomalía en Quibdó:
              </label>

              {/* Botón GPS y Botón Mapa */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleUsarGpsActual('pqrs')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 10px' }}
                >
                  <Crosshair size={15} color="#ef4444" />
                  <span>Usar GPS Celular</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.info('👆 Toca directamente en cualquier punto del mapa para clavar el pin de la incidencia.');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 10px' }}
                >
                  <MapPin size={15} color="#f59e0b" />
                  <span>Tocar en el Mapa</span>
                </button>
              </div>

              {/* Selector por Barrio */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '0.73rem', color: '#94a3b8', marginBottom: '4px' }}>
                  O selecciona el barrio donde ocurrió:
                </label>
                <select
                  className="input-control"
                  style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                  value={selectedBarrioPqrs}
                  onChange={(e) => handleSelectBarrio(e.target.value, 'pqrs')}
                >
                  <option value="">-- Elige el barrio o corregimiento --</option>
                  {COMUNAS_QUIBDO.map((c) => (
                    <optgroup key={c.id} label={`${c.nombre} (${c.tipo})`}>
                      {c.barrios.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Estado de Coordenadas */}
              {pqrsCoords ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginTop: '8px',
                  color: '#34d399',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} />
                    <span>Punto Fijado: {pqrsCoords.lat.toFixed(4)}, {pqrsCoords.lng.toFixed(4)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPqrsCoords(null);
                      setSelectedBarrioPqrs('');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}
                  >
                    Borrar
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.73rem', color: '#f59e0b', marginTop: '6px' }}>
                  ⚠️ Selecciona la ubicación con tu GPS, el barrio o tocando en el mapa.
                </div>
              )}
            </div>

            {/* ADJUNTAR FOTOGRAFÍA / EVIDENCIA */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.18)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#e2e8f0' }}>
                📸 Foto de Evidencia (Cámara o Galería):
              </label>

              {fotoBase64 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={fotoBase64}
                    alt="Evidencia cargada"
                    style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>Foto adjunta lista</div>
                    <button
                      type="button"
                      onClick={() => setFotoBase64('')}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.72rem', color: '#ef4444', padding: '4px 8px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={13} /> Eliminar Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="foto-incidencia"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      color: '#cbd5e1'
                    }}
                  >
                    <Upload size={16} color="#38bdf8" />
                    <span>Tomar foto con la cámara o elegir archivo</span>
                  </label>
                  <input
                    id="foto-incidencia"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleFotoChange}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowPqrsModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviarPqrs}
                disabled={isSubmittingPqrs}
                className="btn btn-danger"
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} />
                <span>{isSubmittingPqrs ? 'Enviando...' : 'Enviar Reporte Cívico'}</span>
              </button>
            </div>
        </div>
      )}

      {/* Modal Itinerario Calle por Calle */}
      {showItinerarioModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <Navigation size={20} /> Itinerario Oficial Calle por Calle
              </h3>
              <button
                onClick={() => setShowItinerarioModal(false)}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Cerrar
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Trazado exacto de calles y esquinas por donde transita el compactador de Aguas del Atrato en Quibdó:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #10b981', padding: '10px 14px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f8fafc' }}>
                  1. 🏁 Inicio del Cuadrante: Calle 31
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Avanza por toda la <b>Calle 31</b> (desde Carrera 2da hacia el Río Atrato). Pasa por las aceras residenciales de la 31.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #38bdf8', padding: '10px 14px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f8fafc' }}>
                  2. ↪️ Giro al Norte: Carrera 1ra (Malecón del Atrato)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Dobla en la esquina de la Calle 31 y sube por toda la <b>Carrera 1ra (Malecón)</b>, pasando frente a Calles 30, 29, 28, 27, 26 y 25.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #f59e0b', padding: '10px 14px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f8fafc' }}>
                  3. ↪️ Giro al Oriente: Calle 24 (Catedral & Plaza)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Al llegar al Malecón con Calle 24, dobla a la derecha y <b>baja por la Calle 24 (entre Cra 1ra y Cra 2da)</b>, pasando exactamente frente a la Catedral San Francisco de Asís y el Parque.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #06b6d4', padding: '10px 14px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f8fafc' }}>
                  4. ⬆️ Tramo Comercial: Calle 24 hacia Carrera 4ta
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Continúa por la <b>Calle 24 cruzando Carrera 2da y Carrera 3ra</b> hasta la Carrera 4ta (frente a la Plaza de Mercado Central).
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #8b5cf6', padding: '10px 14px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f8fafc' }}>
                  5. ⬆️ Conexión Comuna 2: Carrera 4ta hacia Huapango
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Gira al norte por la <b>Carrera 4ta</b> atravesando Calles 25, 26 y 27 en dirección al barrio Huapango y Alameda Reyes.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={() => setShowItinerarioModal(false)}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Horarios de Recolección Quibdó */}
      {showHorariosModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel modal-overlay-content" style={{ width: '100%', maxWidth: '500px', maxHeight: '88vh', overflowY: 'auto', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <Calendar size={20} /> Frecuencias de Recolección Oficiales
              </h3>
              <button
                onClick={() => setShowHorariosModal(false)}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Cerrar
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Turnos y cuadrillas de recolección de Aguas del Atrato E.S.P. para el municipio de Quibdó:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #38bdf8', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#f8fafc' }}>
                  Comuna 1 &bull; Centro Histórico & Malecón del Atrato
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  🗓️ <b>Lunes, Miércoles y Viernes</b> &bull; Turno Nocturno: <b>19:00 a 22:30</b>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #10b981', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#f8fafc' }}>
                  Comuna 2 &bull; Huapango, Alameda Reyes & Yesquita
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  🗓️ <b>Martes, Jueves y Sábado</b> &bull; Turno Diurno: <b>06:00 a 11:30</b>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #f59e0b', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#f8fafc' }}>
                  Comuna 4 &bull; Kennedy, Niño Jesús & El Silencio
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  🗓️ <b>Lunes a Sábado</b> &bull; Turno Vespertino: <b>14:00 a 18:00</b>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={() => setShowHorariosModal(false)}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '7px 16px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ambiental y Cuencas */}
      <AmbientalModal
        isOpen={showAmbientalModal}
        onClose={() => setShowAmbientalModal(false)}
      />
    </div>
  );
};
