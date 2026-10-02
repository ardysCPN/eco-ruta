import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Flame, 
  FileDown,
  ClipboardList,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { MapComponent } from '../../shared/components/MapComponent.js';
import { api } from '../../shared/services/api.js';
import { toast } from 'sonner';

interface AlcaldiaViewProps {
  activeTab?: 'pqrs' | 'zonas_rojas' | 'pgirs';
  onTabChange?: (tab: 'pqrs' | 'zonas_rojas' | 'pgirs') => void;
}

export const AlcaldiaView: React.FC<AlcaldiaViewProps> = ({
  activeTab = 'pqrs',
  onTabChange
}) => {
  const [internalTab, setInternalTab] = useState<'pqrs' | 'zonas_rojas' | 'pgirs'>(activeTab);

  useEffect(() => {
    if (activeTab) {
      setInternalTab(activeTab);
    }
  }, [activeTab]);

  const currentTab = onTabChange ? activeTab : internalTab;
  const switchTab = (tab: 'pqrs' | 'zonas_rojas' | 'pgirs') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const [coberturaComunas, setCoberturaComunas] = useState<any[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);
  const [pqrsList, setPqrsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [resCob, resHeat, resPqrs] = await Promise.all([
        api.getAlcaldiaCobertura(),
        api.getAlcaldiaHeatmap(),
        api.getPqrs()
      ]);
      setCoberturaComunas(resCob.data || []);
      setHeatmapPoints(resHeat.data || []);
      setPqrsList(resPqrs.data || []);
    } catch (err: any) {
      console.error('Error cargando fiscalización alcaldía:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportarReporte = async () => {
    setLoading(true);
    try {
      const data = await api.exportarPgirs();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Oficial_PGIRS_SSPD_Quibdo_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Bitácora oficial PGIRS & SSPD exportada con éxito');
    } catch (err: any) {
      toast.error('Error al exportar reporte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '12px' }}>
      {/* Header Institucional Alcaldía */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(2, 132, 199, 0.4)'
          }}>
            <ShieldCheck size={26} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
              Fiscalización & Supervisión &bull; Alcaldía Municipal de Quibdó
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Secretaría de Medio Ambiente y Biodiversidad &bull; Control Normativo PGIRS & Auditoría SSPD
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} />
            <span>Refrescar</span>
          </button>
          <button
            onClick={handleExportarReporte}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <FileDown size={16} />
            <span>Exportar Bitácora PGIRS / SSPD</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Globales */}
      <div className="grid-responsive-4" style={{ marginBottom: '16px' }}>
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cobertura Urbana Total</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>94.8%</div>
          <div style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>Cumplimiento de meta municipal</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Comunas Auditadas</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>5 Comunas</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Sectores urbanos y ribera Atrato</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Zonas Críticas Registradas</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171' }}>{heatmapPoints.length} Focos</div>
          <div style={{ fontSize: '0.7rem', color: '#fca5a5' }}>Inspección para comparendos</div>
        </div>
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Incidencias PQRS Totales</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>{pqrsList.length} Reportes</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Auditoría de respuesta EPQ</div>
        </div>
      </div>

      {/* Layout: Menú Lateral + Contenido */}
      <div className="grid-sidebar-layout">
        {/* Sidebar Menú de Alcaldía */}
        <div className="glass-panel" style={{ padding: '14px', height: 'fit-content' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 800 }}>
            MÓDULOS DE AUDITORÍA MUNICIPAL
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => switchTab('pqrs')}
              className={`btn ${currentTab === 'pqrs' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.82rem' }}
            >
              <ClipboardList size={16} />
              <span>Auditoría de PQRS ({pqrsList.length})</span>
            </button>

            <button
              onClick={() => switchTab('zonas_rojas')}
              className={`btn ${currentTab === 'zonas_rojas' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.82rem' }}
            >
              <Flame size={16} />
              <span>Zonas Críticas & Focos ({heatmapPoints.length})</span>
            </button>

            <button
              onClick={() => switchTab('pgirs')}
              className={`btn ${currentTab === 'pgirs' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.82rem' }}
            >
              <FileCheck size={16} />
              <span>Bitácora PGIRS & Cobertura</span>
            </button>
          </nav>
        </div>

        {/* Área de Contenido Dinámica */}
        <div>
          {/* TAB 1: AUDITORÍA DE PQRS */}
          {currentTab === 'pqrs' && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardList size={20} color="#38bdf8" />
                    <span>Auditoría Municipal de Quejas & Reclamos Ciudadanos (PQRS)</span>
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Fiscalización directa sobre el operador Aguas del Atrato para verificar los tiempos de respuesta ante el ciudadano.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Fecha & Hora</th>
                      <th style={{ padding: '10px' }}>Tipo Incidencia</th>
                      <th style={{ padding: '10px' }}>Descripción & Barrio</th>
                      <th style={{ padding: '10px' }}>Cuadrilla EPQ Asignada</th>
                      <th style={{ padding: '10px' }}>Estado Actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pqrsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                          No hay reportes de PQRS registrados en el sistema.
                        </td>
                      </tr>
                    ) : (
                      pqrsList.map((p) => {
                        const isResuelta = p.estado === 'resuelta';
                        const isAsignada = p.estado === 'cuadrilla_asignada';
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                              {new Date(p.creado_en).toLocaleString('es-CO')}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171'
                              }}>
                                {p.tipo_incidencia.toUpperCase().replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '10px', color: '#f8fafc', maxWidth: '300px' }}>
                              <div>{p.descripcion}</div>
                              {p.barrio && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>📍 {p.barrio}</div>}
                            </td>
                            <td style={{ padding: '10px', color: isAsignada ? '#34d399' : 'var(--text-dim)' }}>
                              {p.cuadrilla_asignada ? `👷 ${p.cuadrilla_asignada}` : 'Sin cuadrilla aún'}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: isResuelta
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : isAsignada
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(239, 68, 68, 0.2)',
                                color: isResuelta
                                  ? '#34d399'
                                  : isAsignada
                                  ? '#fbbf24'
                                  : '#f87171'
                              }}>
                                {p.estado.toUpperCase().replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MAPA DE ZONAS CRÍTICAS */}
          {currentTab === 'zonas_rojas' && (
            <div>
              <div className="glass-panel" style={{ padding: '18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Flame size={20} color="#ef4444" />
                      <span>Mapa Satelital de Zonas Críticas Rojas & Botaderos Clandestinos</span>
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Identificación geodésica de esquinas con acumulación de residuos y expedición de comparendos ambientales
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#fca5a5' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                    <span>Zona Crítica / Comparendo Ambiental</span>
                  </div>
                </div>

                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <MapComponent
                    heatmapPoints={heatmapPoints}
                    showHeatmap={true}
                    height="460px"
                  />
                </div>
              </div>

              {/* Detalle de Puntos Críticos */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#f8fafc' }}>
                  Esquinas Críticas Priorizadas por la Secretaría de Medio Ambiente:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {heatmapPoints.map((pt, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fca5a5' }}>
                          📍 Punto #{idx + 1}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800 }}>
                          Severidad: {(pt.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Coordenadas: {pt.lat.toFixed(4)}, {pt.lng.toFixed(4)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '6px' }}>
                        Acción: Comparendo y patrullaje ambiental
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTROL NORMATIVO PGIRS & COBERTURA */}
          {currentTab === 'pgirs' && (
            <div>
              <div className="glass-panel" style={{ padding: '18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileCheck size={20} color="#34d399" />
                      <span>Evaluación Oficial de Cobertura y Adherencia PGIRS Quibdó</span>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Métricas auditables para reporte a la Superintendencia de Servicios Públicos Domiciliarios (SSPD).
                    </p>
                  </div>

                  <button
                    onClick={handleExportarReporte}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  >
                    <FileDown size={15} />
                    <span>Descargar Certificado PGIRS (JSON)</span>
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Comuna / Sector Urbano</th>
                        <th style={{ padding: '10px' }}>Micro-Rutas Activas</th>
                        <th style={{ padding: '10px' }}>Faenas Realizadas</th>
                        <th style={{ padding: '10px' }}>Adherencia Promedio</th>
                        <th style={{ padding: '10px' }}>Dictamen Normativo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coberturaComunas.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '10px', fontWeight: 700, color: '#38bdf8' }}>{c.comuna}</td>
                          <td style={{ padding: '10px' }}>{c.total_rutas} Rutas</td>
                          <td style={{ padding: '10px' }}>{c.turnos_realizados} Faenas</td>
                          <td style={{ padding: '10px', fontWeight: 700, color: '#34d399' }}>
                            {c.cumplimiento_promedio_pct}%
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#34d399'
                            }}>
                              CUMPLIMIENTO ÓPTIMO
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
