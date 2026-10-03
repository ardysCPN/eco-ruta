import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  Play, 
  Pause, 
  Square, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Waves, 
  Construction, 
  Wrench, 
  KeyRound,
  Users,
  Navigation
} from 'lucide-react';
import { MapComponent } from '../../shared/components/MapComponent.js';
import { api } from '../../shared/services/api.js';
import { socket } from '../../shared/services/socket.js';
import { useAuth } from '../../shared/contexts/AuthContext.js';
import { useGeolocation } from '../../shared/hooks/useGeolocation.js';
import { useWakeLock } from '../../shared/hooks/useWakeLock.js';
import { useOfflineQueue } from '../../shared/hooks/useOfflineQueue.js';
import { EstadoTurno, MotivoPausa, TipoNovedadVia } from '@eco-ruta/shared';
import { toast } from 'sonner';

export const ConductorView: React.FC = () => {
  const { user, loginConductorPin } = useAuth();

  // Estados de turno y catálogo
  const [rutas, setRutas] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [turnosAsignados, setTurnosAsignados] = useState<any[]>([]);
  const [selectedRuta, setSelectedRuta] = useState<string>('');
  const [selectedVehiculo, setSelectedVehiculo] = useState<string>('a1000000-0000-0000-0000-000000000001');
  const [turnoActivo, setTurnoActivo] = useState<any>(null);
  const [puntosAcopio, setPuntosAcopio] = useState<any[]>([]);
  const [currentRutaObj, setCurrentRutaObj] = useState<any | null>(null);
  const [truckPos, setTruckPos] = useState<any | null>(null);

  // PIN Login rápido de cabina si no está autenticado como conductor
  const [pinInput, setPinInput] = useState('');
  const isConductorAuth = user?.rol === 'conductor';
  const [modoLibreAdmin, setModoLibreAdmin] = useState(false);

  // Alerta sonora anti-desvío
  const [alertaDesvioActiva, setAlertaDesvioActiva] = useState(false);
  const [distanciaDesvio, setDistanciaDesvio] = useState(0);

  // Parada de acopio y temporizador de detención obligatoria (2-5 min)
  const [cronometroParada, setCronometroParada] = useState<number | null>(null);

  // Hooks de hardware y telemetría
  const { position } = useGeolocation(turnoActivo?.estado === EstadoTurno.ACTIVO);
  const { isLocked, requestWakeLock } = useWakeLock();
  const { enqueuePosition } = useOfflineQueue(turnoActivo?.id || null);
  const [contadorTelemetria, setContadorTelemetria] = useState(0);

  const telemetryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cargar catálogo inicial de Quibdó y turnos asignados a este conductor
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [resRutas, resVehiculos, resTurnos] = await Promise.all([
          api.getRutas(),
          api.getVehiculos(),
          api.getTurnosActivos()
        ]);
        setRutas(resRutas.data);
        setVehiculos(resVehiculos.data);

        // Si el conductor tiene turnos asignados por EPQ, cargarlos
        if (user?.id) {
          try {
            const resAsig = await api.getTurnosConductor(user.id);
            if (resAsig.data && resAsig.data.length > 0) {
              setTurnosAsignados(resAsig.data);
              setSelectedRuta(resAsig.data[0].ruta_id);
              if (resAsig.data[0].vehiculo_id) {
                setSelectedVehiculo(resAsig.data[0].vehiculo_id);
              }
            } else if (resRutas.data.length > 0) {
              setSelectedRuta(resRutas.data[0].id);
            }
          } catch {
            if (resRutas.data.length > 0) setSelectedRuta(resRutas.data[0].id);
          }
        } else if (resRutas.data.length > 0) {
          setSelectedRuta(resRutas.data[0].id);
        }

        if (resVehiculos.data.length > 0 && !selectedVehiculo) {
          setSelectedVehiculo(resVehiculos.data[0].id);
        }

        if (resTurnos.data.length > 0) {
          setTurnoActivo(resTurnos.data[0]);
          setSelectedRuta(resTurnos.data[0].ruta_id);
          requestWakeLock();
        }
      } catch (err: any) {
        console.error('Error cargando cabina conductor:', err.message);
      }
    }
    loadCatalog();
  }, [user]);

  // Actualizar objeto de ruta actual cuando cambia selectedRuta
  useEffect(() => {
    if (selectedRuta && rutas.length > 0) {
      const r = rutas.find((item) => item.id === selectedRuta);
      if (r) setCurrentRutaObj(r);

      api.getPuntosAcopio(selectedRuta).then((res) => {
        setPuntosAcopio(res.data);
      });
    }
  }, [selectedRuta, rutas]);

  // Escuchar alertas de desvío por WebSocket (>150m)
  useEffect(() => {
    const handleAlarmaDesvio = (payload: any) => {
      setAlertaDesvioActiva(true);
      setDistanciaDesvio(payload.distancia || 160);

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } catch {}

      toast.error('⚠️ ALARMA ACÚSTICA: ¡DESVÍO DE RUTA DETECTADO!', {
        description: payload.mensaje || `Estás a ${payload.distancia}m fuera del corredor oficial de Quibdó.`,
        duration: 9000
      });
    };

    socket.on('conductor:alarma_desvio', handleAlarmaDesvio);
    return () => {
      socket.off('conductor:alarma_desvio', handleAlarmaDesvio);
    };
  }, []);

  // Escuchar telemetría en vivo del camión en la ruta asignada
  useEffect(() => {
    if (!turnoActivo) return;

    socket.emit('ruta:unirse', turnoActivo.ruta_id);

    const handleTelemetria = (data: any) => {
      if (data.ruta_id === turnoActivo.ruta_id) {
        setTruckPos({
          lat: data.lat,
          lng: data.lng,
          velocidad: data.velocidad_kmh || 18,
          rumbo: data.rumbo_grados || 45,
          placa: data.vehiculo_id || 'COMP-01',
          avance: data.porcentaje_avance || 20
        });
        setContadorTelemetria((prev) => prev + 1);
      }
    };

    socket.on('telemetria:actualizacion', handleTelemetria);
    socket.on('conductor:telemetria_retorno', handleTelemetria);
    return () => {
      socket.off('telemetria:actualizacion', handleTelemetria);
      socket.off('conductor:telemetria_retorno', handleTelemetria);
    };
  }, [turnoActivo]);

  // Emisión continua de telemetría cada 5 segundos
  useEffect(() => {
    if (turnoActivo?.estado === EstadoTurno.ACTIVO) {
      telemetryIntervalRef.current = setInterval(() => {
        const currentLat = position?.lat || 5.6940;
        const currentLng = position?.lng || -76.6580;

        const payload = {
          turno_id: turnoActivo.id,
          vehiculo_id: turnoActivo.vehiculo_id || 'COMP-01',
          ruta_id: turnoActivo.ruta_id,
          lat: currentLat,
          lng: currentLng,
          velocidad_kmh: position?.speed || 18,
          rumbo_grados: position?.heading || 45,
          bateria_nivel: 88,
          timestamp: Date.now()
        };

        enqueuePosition(payload);
        setContadorTelemetria((prev) => prev + 1);
      }, 5000);
    } else {
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
        telemetryIntervalRef.current = null;
      }
    }

    return () => {
      if (telemetryIntervalRef.current) clearInterval(telemetryIntervalRef.current);
    };
  }, [turnoActivo, position, enqueuePosition]);

  // Temporizador de parada en punto de acopio
  useEffect(() => {
    let timer: any = null;
    if (cronometroParada !== null && cronometroParada > 0) {
      timer = setTimeout(() => {
        setCronometroParada(cronometroParada - 1);
      }, 1000);
    } else if (cronometroParada === 0) {
      toast.success('✅ ¡Tiempo mínimo de parada de cuadrilla cumplido en este punto!');
      setCronometroParada(null);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cronometroParada]);

  // Login de PIN
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      toast.error('Ingresa tu PIN de 4 dígitos');
      return;
    }
    try {
      await loginConductorPin(pinInput, selectedVehiculo);
      requestWakeLock();
    } catch {}
  };

  // Rutas y Vehículos asignados estrictamente a este conductor por Despacho EPQ
  const tieneTurnosAsignados = turnosAsignados.length > 0;

  const rutasConductor = (tieneTurnosAsignados && !modoLibreAdmin)
    ? (rutas.filter((r) => turnosAsignados.some((t) => t.ruta_id === r.id)).length > 0
        ? rutas.filter((r) => turnosAsignados.some((t) => t.ruta_id === r.id))
        : turnosAsignados.map(t => ({ id: t.ruta_id, nombre: t.ruta_nombre, comuna: t.ruta_comuna, horario_estimado: t.horario_estimado, trazado_geojson: t.trazado_geojson })))
    : rutas;

  const vehiculosConductor = (tieneTurnosAsignados && !modoLibreAdmin)
    ? vehiculos.filter((v) => turnosAsignados.some((t) => t.vehiculo_id === v.id))
    : vehiculos;

  const turnoAsignadoSeleccionado = turnosAsignados.find((t) => t.ruta_id === selectedRuta) || turnosAsignados[0] || null;

  // Iniciar turno
  const handleIniciarTurno = async () => {
    try {
      const res = await api.iniciarTurno({
        ruta_id: selectedRuta,
        vehiculo_id: selectedVehiculo,
        conductor_nombre: turnoAsignadoSeleccionado?.conductor_nombre || (user?.nombre ? `${user.nombre} ${user.apellidos || ''}`.trim() : 'Carlos Palacios'),
        conductor_id: user?.id
      });
      setTurnoActivo(res.data);
      requestWakeLock();
      toast.success('¡Jornada de recolección en Quibdó iniciada con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar turno');
    }
  };

  const handlePausarTurno = async (motivo: MotivoPausa) => {
    if (!turnoActivo) return;
    try {
      const res = await api.pausarTurno({
        turno_id: turnoActivo.id,
        motivo,
        descripcion: `Pausa operativa en Quibdó: ${motivo}`
      });
      setTurnoActivo(res.data);
      toast.info(`Turno pausado: ${motivo.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al pausar');
    }
  };

  const handleReanudarTurno = async () => {
    if (!turnoActivo) return;
    try {
      const res = await api.reanudarTurno({ turno_id: turnoActivo.id });
      setTurnoActivo(res.data);
      toast.success('¡Turno reanudado! Continuando trazado oficial.');
    } catch (err: any) {
      toast.error(err.message || 'Error al reanudar');
    }
  };

  const handleFinalizarTurno = async () => {
    if (!turnoActivo) return;
    if (!confirm('¿Confirmas que el vehículo compactador ya se encuentra parqueado en el patio central o base operativa?')) return;
    try {
      await api.finalizarTurno({ turno_id: turnoActivo.id });
      setTurnoActivo(null);
      setTruckPos(null);
      toast.success('Jornada completada. Vehículo reportado en base operativa.');
    } catch (err: any) {
      toast.error(err.message || 'Error al finalizar');
    }
  };

  // Modo Retorno a Base / Relleno Cabí (Seguimiento Silencioso)
  const handleIniciarRetorno = async () => {
    if (!turnoActivo) return;
    if (!confirm('¿Confirmas que terminaste la recolección domiciliaria en esta micro-ruta e inicias el viaje de retorno al patio central / Cabí?')) return;
    try {
      await api.iniciarRetorno(turnoActivo.id);
      setTurnoActivo((prev: any) => ({ ...prev, estado: 'en_retorno' }));
      toast.success('🏁 Recolección en micro-ruta marcada como finalizada. Modo retorno a patio activo.');
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar retorno');
    }
  };

  // Enviar novedad rápida en 1 toque
  const handleEnviarNovedad = async (tipo: TipoNovedadVia, desc: string) => {
    try {
      await api.crearNovedad({
        tipo_novedad: tipo,
        descripcion: desc,
        lat: position?.lat || 5.6940,
        lng: position?.lng || -76.6580,
        vehiculo_id: selectedVehiculo,
        turno_id: turnoActivo?.id
      });
      toast.warning(`Novedad transmitida a despacho: ${tipo.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar novedad');
    }
  };

  // Determinar datos de cuadrilla para mostrar
  const cuadrillaInfo = {
    conductor: turnoActivo?.conductor_nombre || turnoAsignadoSeleccionado?.conductor_nombre || (user?.nombre ? `${user.nombre} ${user.apellidos || ''}`.trim() : 'Carlos Palacios'),
    ayudante1: turnoActivo?.ayudante_1 || turnoAsignadoSeleccionado?.ayudante_1 || 'Sin asignar',
    ayudante2: turnoActivo?.ayudante_2 || turnoAsignadoSeleccionado?.ayudante_2 || 'Sin asignar',
    barrendero: turnoActivo?.barrendero || turnoAsignadoSeleccionado?.barrendero || 'Sin asignar'
  };

  // Si no está autenticado como conductor, mostrar pantalla de PIN
  if (!isConductorAuth) {
    return (
      <div style={{ maxWidth: '440px', margin: '40px auto', padding: '16px' }}>
        <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)'
          }}>
            <Truck size={30} color="#ffffff" />
          </div>

          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', color: '#f8fafc' }}>
            Cabina del Conductor
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Aguas del Atrato &bull; Quibdó (Chocó)
          </p>

          <form onSubmit={handlePinLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Vehículo / Placa:</label>
              <select
                className="input-control"
                value={selectedVehiculo}
                onChange={(e) => setSelectedVehiculo(e.target.value)}
              >
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.codigo} ({v.placa}) - {v.capacidad_ton} Ton
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                PIN Operativo (4 dígitos):
              </label>
              <input
                type="password"
                maxLength={4}
                autoFocus
                className="input-control"
                style={{ textAlign: 'center', fontSize: '1.6rem', letterSpacing: '10px', fontWeight: 800 }}
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: '6px' }}>
                PIN Demo Conductor: <b>1234</b>
              </span>
            </div>

            <button type="submit" className="btn btn-warning" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
              <KeyRound size={18} />
              <span>Acceder a Cabina Móvil</span>
            </button>
          </form>
        </div>
      </div>
    );
  }



  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '12px' }}>
      {/* Alerta Acústica Anti-Desvío Flotante */}
      {alertaDesvioActiva && (
        <div style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '14px',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'bounce 0.5s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={28} color="#fca5a5" />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#ffffff', fontWeight: 800 }}>
                ¡ALERTA DE DESVÍO DE CORREDOR VIAL!
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#fee2e2' }}>
                Estás a aprox. {distanciaDesvio} metros fuera del trazado oficial de Quibdó. Retoma el cuadrante asignado.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAlertaDesvioActiva(false)}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 10px', background: 'rgba(0,0,0,0.4)', border: 'none' }}
          >
            Silenciar
          </button>
        </div>
      )}

      {/* Cabecera del Conductor & Estado de Telemetría */}
      <div className="glass-panel" style={{
        padding: '12px 18px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
          }}>
            <Truck size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                Conductor: {cuadrillaInfo.conductor}
              </span>
              <span className="badge badge-activo" style={{ fontSize: '0.68rem' }}>
                Licencia C2 Activa
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Compactador COMP-01 (CHO-101) &bull; Aguas del Atrato Quibdó
            </div>
          </div>
        </div>

        {/* Indicadores de Hardware (WakeLock & Background Sync) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.72rem',
            padding: '4px 10px',
            borderRadius: '6px',
            background: isLocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isLocked ? '#34d399' : '#f87171',
            fontWeight: 700
          }}>
            {isLocked ? '💡 Pantalla Fija' : '⚠️ Sin WakeLock'}
          </span>
          <span style={{
            fontSize: '0.72rem',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            fontWeight: 700
          }}>
            📡 {contadorTelemetria} Puntos GPS
          </span>
        </div>
      </div>

      {/* Tarjeta de Cuadrilla Asignada por EPQ */}
      <div className="glass-panel" style={{
        padding: '12px 16px',
        marginBottom: '12px',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8' }}>
          <Users size={16} />
          <span>Tripulación Asignada por Despacho EPQ:</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>🚛 Conductor Principal:</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{cuadrillaInfo.conductor}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>🦺 Ayudante Recolección 1:</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{cuadrillaInfo.ayudante1}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>🦺 Ayudante Recolección 2:</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{cuadrillaInfo.ayudante2}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>🧹 Barrendero de Vías:</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{cuadrillaInfo.barrendero}</div>
          </div>
        </div>
      </div>

      {/* MAPA INTERACTIVO DE NAVEGACIÓN EN CABINA (Vital para saber por dónde meterse y no perder giros) */}
      <div style={{
        position: 'relative',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '14px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '12px',
          right: '12px',
          zIndex: 900,
          background: 'rgba(15, 23, 42, 0.92)',
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.78rem',
          color: '#f8fafc',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={16} color="#10b981" />
            <span><b>Trazado en Calles:</b> {currentRutaObj?.nombre || 'Selecciona una micro-ruta'}</span>
          </div>
          {currentRutaObj && (
            <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              {currentRutaObj.comuna} &bull; {puntosAcopio.length} Paradas Obligatorias
            </span>
          )}
        </div>

        <MapComponent
          truck={truckPos || (turnoActivo ? {
            lat: position?.lat || 5.6897,
            lng: position?.lng || -76.6604,
            velocidad: position?.speed || 18,
            rumbo: position?.heading || 45,
            placa: 'COMP-01',
            avance: 42
          } : null)}
          routeGeoJson={currentRutaObj?.trazado_geojson}
          puntosAcopio={puntosAcopio}
          height="380px"
        />
      </div>

      {/* Selector de Ruta si no hay turno activo */}
      {!turnoActivo && (
        <div className="glass-panel" style={{ padding: '18px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '0.96rem', color: '#f8fafc', fontWeight: 800 }}>
              {tieneTurnosAsignados && !modoLibreAdmin
                ? '📋 Hoja de Ruta Asignada Oficial (Despacho EPQ):'
                : 'Seleccionar Hoja de Ruta (Quibdó):'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {tieneTurnosAsignados && (
                <span className="badge badge-activo" style={{ fontSize: '0.72rem' }}>
                  ✓ {turnosAsignados.length} Turno Oficial Asignado
                </span>
              )}
              {user?.rol === 'operaciones' && (
                <button
                  type="button"
                  onClick={() => setModoLibreAdmin((prev) => !prev)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#94a3b8',
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    cursor: 'pointer'
                  }}
                >
                  {modoLibreAdmin ? 'Volver a mi asignación' : 'Modo Admin Libre'}
                </button>
              )}
            </div>
          </div>

          {tieneTurnosAsignados && !modoLibreAdmin && turnoAsignadoSeleccionado ? (
            /* FICHA DE ASIGNACIÓN ESTRICTA DEL CONDUCTOR */
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Si tiene más de 1 turno asignado, permite elegir entre SUS turnos asignados */}
              {turnosAsignados.length > 1 && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Tienes varios turnos asignados para hoy. Elige cuál iniciar:
                  </label>
                  <select
                    className="input-control"
                    value={selectedRuta}
                    onChange={(e) => {
                      setSelectedRuta(e.target.value);
                      const t = turnosAsignados.find(item => item.ruta_id === e.target.value);
                      if (t?.vehiculo_id) setSelectedVehiculo(t.vehiculo_id);
                    }}
                  >
                    {turnosAsignados.map((t) => (
                      <option key={t.id} value={t.ruta_id}>
                        {t.ruta_nombre} ({t.ruta_comuna}) - Vehículo {t.vehiculo_codigo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid-responsive-2" style={{ gap: '14px' }}>
                {/* Datos de Ruta */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>
                    Ruta Oficial Asignada
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399', margin: '4px 0 2px' }}>
                    {turnoAsignadoSeleccionado.ruta_nombre}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                    Sector: <b>{turnoAsignadoSeleccionado.ruta_comuna || 'Quibdó'}</b> &bull; Horario: <b>{turnoAsignadoSeleccionado.horario_estimado || 'Jornada Diurna'}</b>
                  </div>
                </div>

                {/* Datos de Vehículo Compactador */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>
                    Vehículo Compactador Asignado
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0 2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={20} color="#38bdf8" />
                    <span>{turnoAsignadoSeleccionado.vehiculo_codigo} ({turnoAsignadoSeleccionado.vehiculo_placa})</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Vehículo reservado para tu turno para evitar confusiones de flota.
                  </div>
                </div>
              </div>

              {/* Fila de Compañeros de Cuadrilla */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Users size={16} color="#fbbf24" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
                    Compañeros de Cuadrilla Asignados:
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    🧤 Ayudante 1: <b>{turnoAsignadoSeleccionado.ayudante_1 || 'Sin asignar'}</b>
                  </span>
                  <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    🧤 Ayudante 2: <b>{turnoAsignadoSeleccionado.ayudante_2 || 'Sin asignar'}</b>
                  </span>
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    🧹 Barrendero: <b>{turnoAsignadoSeleccionado.barrendero || 'Sin asignar'}</b>
                  </span>
                </div>
              </div>
            </div>
          ) : rutasConductor.length === 0 ? (
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid #f59e0b',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '14px',
              color: '#fef3c7',
              fontSize: '0.84rem',
              lineHeight: 1.5
            }}>
              <b style={{ color: '#fbbf24' }}>📍 No tienes turnos asignados por la administración de EPQ para hoy.</b>
              <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#fde68a' }}>
                Comunícate con el despachador de EPQ para que te asigne ruta y compactador, o ingresa al módulo <b>Operaciones</b> para planificar la jornada.
              </p>
            </div>
          ) : (
            <div className="grid-responsive-2" style={{ marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ruta Asignada:</label>
                <select
                  className="input-control"
                  value={selectedRuta}
                  onChange={(e) => setSelectedRuta(e.target.value)}
                >
                  {rutasConductor.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} ({r.comuna}) - {r.horario_estimado || 'Horario Oficial'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compactador:</label>
                <select
                  className="input-control"
                  value={selectedVehiculo}
                  onChange={(e) => setSelectedVehiculo(e.target.value)}
                >
                  {vehiculosConductor.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.codigo} ({v.placa}) - {v.capacidad_ton} Ton
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleIniciarTurno}
            disabled={rutasConductor.length === 0}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontSize: '1rem', 
              fontWeight: 800,
              opacity: rutasConductor.length === 0 ? 0.45 : 1,
              cursor: rutasConductor.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Play size={20} />
            <span>INICIAR MI TURNO DE RECOLECCIÓN</span>
          </button>
        </div>
      )}

      {/* Controles de Cabina en Marcha */}
      {turnoActivo && (
        <div>
          {/* Si está en retorno silencioso a Patio / Cabí */}
          {turnoActivo.estado === 'en_retorno' ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1.5px solid #0284c7',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.25)'
            }}>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🚛 MODO RETORNO A PATIO / CABÍ (Seguimiento Silencioso)</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                  La recolección en calle ya finalizó para los ciudadanos (sin alarmas). Conduce de vuelta al patio central o relleno Cabí; la Torre de Control EPQ monitorea tu recorrido por seguridad vial.
                </div>
              </div>

              <button
                onClick={handleFinalizarTurno}
                className="btn btn-danger"
                style={{ padding: '14px 22px', fontSize: '0.92rem', fontWeight: 800 }}
              >
                <Square size={18} />
                <span>CERRAR TURNO (PARQUEADO EN PATIO)</span>
              </button>
            </div>
          ) : (
            /* Botonera de Recolección Activa */
            <div className="grid-responsive-2" style={{ marginBottom: '14px' }}>
              <button
                onClick={handleIniciarRetorno}
                className="btn btn-primary"
                style={{
                  padding: '16px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: '1px solid #38bdf8',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)'
                }}
                title="Terminar recolección domiciliaria e iniciar viaje de regreso a base o relleno Cabí"
              >
                <span>🏁 FINALIZAR RECOLECCIÓN & RETORNO A PATIO</span>
              </button>

              {turnoActivo.estado === EstadoTurno.ACTIVO ? (
                <button
                  onClick={() => handlePausarTurno(MotivoPausa.TRAFICO)}
                  className="btn btn-warning"
                  style={{ padding: '16px', fontSize: '0.92rem', fontWeight: 800, justifyContent: 'center' }}
                >
                  <Pause size={20} />
                  <span>PAUSA OPERATIVA</span>
                </button>
              ) : (
                <button
                  onClick={handleReanudarTurno}
                  className="btn btn-secondary"
                  style={{ padding: '16px', fontSize: '0.92rem', fontWeight: 800, justifyContent: 'center', border: '1px solid #10b981', color: '#34d399' }}
                >
                  <Play size={20} />
                  <span>REANUDAR RUTA</span>
                </button>
              )}
            </div>
          )}

          {/* Control de Paradas en Puntos de Acopio Obligatorios */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                <CheckCircle2 size={18} />
                <span>Parada en Punto de Acopio de Cuadrilla:</span>
              </div>
              <button
                onClick={() => setCronometroParada(180)} // 3 minutos
                className="btn btn-primary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Clock size={14} /> <span>Iniciar Detención (3 min)</span>
              </button>
            </div>

            {cronometroParada !== null && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                textAlign: 'center',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>
                  ⏳ TIEMPO RESTANTE DE DETENCIÓN OBLIGATORIA:
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', letterSpacing: '2px' }}>
                  {Math.floor(cronometroParada / 60)}:{(cronometroParada % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )}

            {/* Listado de paradas oficiales */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {puntosAcopio.map((pa, idx) => (
                <div key={pa.id} style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>#{idx + 1}</span>
                    <span>{pa.nombre}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>⏱️ {pa.tiempo_parada_min} min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botonera de Novedades de Vía en 1 Toque */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <span>Reportar Novedad de Vía Inmediata:</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => handleEnviarNovedad(TipoNovedadVia.CALLE_INUNDADA, 'Vía anegada por lluvia tropical en Quibdó')}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.8rem' }}
              >
                <Waves size={18} color="#38bdf8" />
                <span>Calle Inundada</span>
              </button>

              <button
                onClick={() => handleEnviarNovedad(TipoNovedadVia.VIA_BLOQUEADA, 'Vía cerrada por obra civil / paso restringido')}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.8rem' }}
              >
                <Construction size={18} color="#f59e0b" />
                <span>Vía Bloqueada</span>
              </button>

              <button
                onClick={() => handleEnviarNovedad(TipoNovedadVia.FALLA_MECANICA, 'Falla mecánica del compactador')}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.8rem' }}
              >
                <Wrench size={18} color="#ef4444" />
                <span>Falla Mecánica</span>
              </button>

              <button
                onClick={() => handleEnviarNovedad(TipoNovedadVia.TRASLADO_BOTADERO, 'Rumbo a descarga en botadero/relleno')}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.8rem' }}
              >
                <Truck size={18} color="#10b981" />
                <span>Hacia Botadero</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
