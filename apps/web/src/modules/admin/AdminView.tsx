import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  Clock, 
  FileText, 
  Flame, 
  RotateCcw, 
  ChevronRight
} from 'lucide-react';
import { MapComponent } from '../../shared/components/MapComponent.js';
import { api } from '../../shared/services/api.js';
import { socket } from '../../shared/services/socket.js';
import { EstadoPQRS } from '@eco-ruta/shared';

export const AdminView: React.FC = () => {
  const [turnosActivos, setTurnosActivos] = useState<any[]>([]);
  const [pqrsList, setPqrsList] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);
  const [selectedTurnoId, setSelectedTurnoId] = useState<string | null>(null);

  // Playback histórico
  const [historialPuntos, setHistorialPuntos] = useState<[number, number][]>([]);

  // Cargar datos del dashboard
  const refreshData = async () => {
    try {
      const [resTurnos, resPqrs, resRutas] = await Promise.all([
        api.getTurnosActivos(),
        api.getPqrs(),
        api.getRutas()
      ]);
      setTurnosActivos(resTurnos.data);
      setPqrsList(resPqrs.data);
      setRutas(resRutas.data);

      if (resTurnos.data.length > 0 && !selectedTurnoId) {
        setSelectedTurnoId(resTurnos.data[0].id);
      }
    } catch (err: any) {
      console.error('Error cargando torre de control:', err.message);
    }
  };

  useEffect(() => {
    refreshData();

    // Suscribirse a flota global y eventos de incidencias
    socket.emit('flota:suscribir');

    const handleFlotaUpdate = (payload: any) => {
      setTurnosActivos((prev) =>
        prev.map((t) => {
          if (t.id === payload.turno_id) {
            return {
              ...t,
              lat: payload.lat,
              lng: payload.lng,
              velocidad: payload.velocidad_kmh,
              rumbo: payload.rumbo_grados,
              porcentaje_avance: payload.porcentaje_avance,
              ultima_actualizacion: new Date().toISOString()
            };
          }
          return t;
        })
      );
    };

    const handleNuevoPqrs = (nuevo: any) => {
      setPqrsList((prev) => [nuevo, ...prev]);
    };

    const handlePqrsActualizado = (actualizado: any) => {
      setPqrsList((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)));
    };

    socket.on('flota:actualizada', handleFlotaUpdate);
    socket.on('flota:refrescar', refreshData);
    socket.on('pqrs:nuevo', handleNuevoPqrs);
    socket.on('pqrs:actualizado', handlePqrsActualizado);

    return () => {
      socket.off('flota:actualizada', handleFlotaUpdate);
      socket.off('flota:refrescar', refreshData);
      socket.off('pqrs:nuevo', handleNuevoPqrs);
      socket.off('pqrs:actualizado', handlePqrsActualizado);
    };
  }, [selectedTurnoId]);

  // Cargar playback de recorrido si se selecciona un turno
  const handleVerHistorial = async (turnoId: string) => {
    setSelectedTurnoId(turnoId);
    try {
      const res = await api.getHistorialTurno(turnoId);
      const points: [number, number][] = res.data.map((p: any) => [Number(p.lat), Number(p.lng)]);
      setHistorialPuntos(points);
    } catch (err: any) {
      console.error('Error cargando historial:', err.message);
    }
  };

  // Cambiar estado en el Kanban
  const handleCambiarEstadoPqrs = async (id: string, nuevoEstado: EstadoPQRS) => {
    try {
      await api.actualizarEstadoPqrs(id, nuevoEstado);
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  // Turno seleccionado actualmente
  const turnoSeleccionado = turnosActivos.find((t) => t.id === selectedTurnoId);
  const rutaSeleccionada = rutas.find((r) => r.id === turnoSeleccionado?.ruta_id);

  // Métricas para PGIRS / SSPD
  const totalPqrs = pqrsList.length;
  const resueltasPqrs = pqrsList.filter((p) => p.estado === EstadoPQRS.RESUELTA).length;
  const tasaResolucion = totalPqrs > 0 ? Math.round((resueltasPqrs / totalPqrs) * 100) : 100;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px' }}>
      {/* Encabezado Institucional EPQ */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(2, 132, 199, 0.4)'
          }}>
            <ShieldCheck size={28} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', color: '#f8fafc', fontWeight: 800 }}>
              Torre de Control & Auditoría de Operación
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Empresas Públicas del Quindío (EPQ) • Supervisión PGIRS y Vigilancia SSPD
            </p>
          </div>
        </div>

        {/* Tarjetas de Métricas Ejecutivas */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 18px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Camiones en Ruta</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
              {turnosActivos.length}
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 18px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Incidencias Cívicas</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>
              {totalPqrs}
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 18px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Efectividad PGIRS</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
              {tasaResolucion}%
            </span>
          </div>

          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0 16px' }}
          >
            <FileText size={16} /> Exportar Reporte SSPD
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista de Flota a la izquierda, Mapa Maestro a la derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Panel Izquierdo: Lista de Compactadores Activos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '18px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} color="#10b981" /> Flota en Operación
            </h3>

            {turnosActivos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                No hay turnos activos actualmente.<br/>
                Usa el botón <b>"⚡ Simular Camión"</b> en la barra superior para generar telemetría en vivo.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {turnosActivos.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleVerHistorial(t.id)}
                    style={{
                      background: selectedTurnoId === t.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.25)',
                      border: selectedTurnoId === t.id ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                        {t.vehiculo_codigo?.toUpperCase() || 'COMPACTADOR'} ({t.vehiculo_placa})
                      </span>
                      <span className={`badge badge-${t.estado}`}>{t.estado}</span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Ruta: <b>{t.ruta_nombre}</b><br/>
                      Conductor: {t.conductor_nombre}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8' }}>
                      <span>Velocidad: <b style={{ color: '#38bdf8' }}>{t.velocidad || 0} km/h</b></span>
                      <span>Batería: <b>{t.bateria_nivel || 100}%</b></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Mapa de Supervisión Global */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>
                  Supervisión Geoespacial en Vivo
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Visualizando trazado oficial vs rastro satelital e incidencias cívicas
                </span>
              </div>

              {selectedTurnoId && (
                <button
                  onClick={() => handleVerHistorial(selectedTurnoId)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                >
                  <RotateCcw size={14} /> Recargar Playback ({historialPuntos.length} puntos)
                </button>
              )}
            </div>

            <MapComponent
              truck={turnoSeleccionado?.lat ? {
                lat: Number(turnoSeleccionado.lat),
                lng: Number(turnoSeleccionado.lng),
                rumbo: Number(turnoSeleccionado.rumbo || 0),
                velocidad: Number(turnoSeleccionado.velocidad || 0),
                placa: turnoSeleccionado.vehiculo_placa,
                avance: turnoSeleccionado.porcentaje_avance
              } : null}
              historialPuntos={historialPuntos}
              routeGeoJson={rutaSeleccionada?.trazado_geojson}
              pqrsList={pqrsList}
              height="520px"
            />
          </div>
        </div>
      </div>

      {/* Tablero Kanban de Gestión de Quejas y Puntos Críticos */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={20} color="#f87171" /> Tablero de Resolución de Incidencias Cívicas (PQRS)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[
            { estado: EstadoPQRS.RECIBIDA, title: 'Recibidas', color: '#f87171' },
            { estado: EstadoPQRS.EN_VERIFICACION, title: 'En Verificación', color: '#fbbf24' },
            { estado: EstadoPQRS.CUADRILLA_ASIGNADA, title: 'Cuadrilla Asignada', color: '#38bdf8' },
            { estado: EstadoPQRS.RESUELTA, title: 'Resueltas con Evidencia', color: '#34d399' }
          ].map((col) => {
            const items = pqrsList.filter((p) => p.estado === col.estado);
            return (
              <div key={col.estado} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: col.color }}>{col.title}</span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                    {items.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
                  {items.map((p) => (
                    <div key={p.id} style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: col.color, fontWeight: 700 }}>
                        {p.tipo_incidencia?.replace('_', ' ')}
                      </span>
                      <p style={{ fontSize: '0.82rem', margin: '4px 0 8px', color: '#e2e8f0' }}>{p.descripcion}</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>📍 {Number(p.lat).toFixed(3)}, {Number(p.lng).toFixed(3)}</span>
                        
                        {/* Selector de avance de estado */}
                        {col.estado !== EstadoPQRS.RESUELTA && (
                          <button
                            onClick={() => {
                              const siguienteEstado = 
                                col.estado === EstadoPQRS.RECIBIDA ? EstadoPQRS.EN_VERIFICACION :
                                col.estado === EstadoPQRS.EN_VERIFICACION ? EstadoPQRS.CUADRILLA_ASIGNADA :
                                EstadoPQRS.RESUELTA;
                              handleCambiarEstadoPqrs(p.id, siguienteEstado);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                            title="Avanzar estado"
                          >
                            <span>Avanzar</span>
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
