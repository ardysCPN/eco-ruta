import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Truck, 
  FileText, 
  CheckCircle2, 
  Send, 
  RefreshCw, 
  Users, 
  CalendarDays,
  Route,
  Compass,
  Trash2,
  Sparkles,
  Save,
  Zap,
  UserPlus,
  FileSpreadsheet,
  Search,
  Check,
  X
} from 'lucide-react';
import { MapComponent } from '../../shared/components/MapComponent.js';
import { EmployeeSelectCombobox, EmpleadoItem } from '../../shared/components/EmployeeSelectCombobox.js';
import { api } from '../../shared/services/api.js';
import { socket } from '../../shared/services/socket.js';
import { EstadoPQRS, COMUNAS_QUIBDO } from '@eco-ruta/shared';
import { toast } from 'sonner';

interface OperacionesViewProps {
  activeTab?: 'multifleet' | 'planificador' | 'disenador' | 'empleados' | 'pqrs';
  onTabChange?: (tab: 'multifleet' | 'planificador' | 'disenador' | 'empleados' | 'pqrs') => void;
}

export const OperacionesView: React.FC<OperacionesViewProps> = ({ 
  activeTab = 'multifleet', 
  onTabChange 
}) => {
  const [internalTab, setInternalTab] = useState<'multifleet' | 'planificador' | 'disenador' | 'empleados' | 'pqrs'>(activeTab);

  // Sincronizar tab interno y externo cuando cambie activeTab desde Navbar
  useEffect(() => {
    if (activeTab) {
      setInternalTab(activeTab);
    }
  }, [activeTab]);

  const currentTab = onTabChange ? activeTab : internalTab;
  const switchTab = (tab: 'multifleet' | 'planificador' | 'disenador' | 'empleados' | 'pqrs') => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Datos de operaciones
  const [flotaDetallada, setFlotaDetallada] = useState<any[]>([]);
  const [turnosActivos, setTurnosActivos] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);
  const [pqrsList, setPqrsList] = useState<any[]>([]);
  const [novedades, setNovedades] = useState<any[]>([]);

  // Empleados y Cuadrillas EPQ
  const [empleados, setEmpleados] = useState<EmpleadoItem[]>([]);
  const [busquedaEmp, setBusquedaEmp] = useState('');
  const [filtroCargoEmp, setFiltroCargoEmp] = useState('todos');
  const [filtroEstadoEmp, setFiltroEstadoEmp] = useState('todos');
  
  // Modales de Empleados
  const [isModalCrearEmpOpen, setIsModalCrearEmpOpen] = useState(false);
  const [isModalCargaMasivaOpen, setIsModalCargaMasivaOpen] = useState(false);
  
  // Formulario Nuevo Empleado
  const [nuevoEmpDoc, setNuevoEmpDoc] = useState('');
  const [nuevoEmpNombre, setNuevoEmpNombre] = useState('');
  const [nuevoEmpApellidos, setNuevoEmpApellidos] = useState('');
  const [nuevoEmpCargo, setNuevoEmpCargo] = useState('conductor');
  const [nuevoEmpLicencia, setNuevoEmpLicencia] = useState('C2');
  const [nuevoEmpTel, setNuevoEmpTel] = useState('');
  const [nuevoEmpEmail, setNuevoEmpEmail] = useState('');
  const [nuevoEmpPass, setNuevoEmpPass] = useState('123456');

  // Formulario Carga Masiva
  const [csvTexto, setCsvTexto] = useState('');

  // Planificador de turnos (30 días)
  const [turnosPlanificados, setTurnosPlanificados] = useState<any[]>([]);
  const [fechaProg, setFechaProg] = useState(() => new Date().toISOString().split('T')[0]);
  const [progRuta, setProgRuta] = useState('');
  const [progVehiculo, setProgVehiculo] = useState('');
  const [progConductor, setProgConductor] = useState('Ardis Díaz Mosquera');
  const [progAyudante1, setProgAyudante1] = useState('Hamilton Rivas');
  const [progAyudante2, setProgAyudante2] = useState('Jhon Jairo Moreno');
  const [progBarrendero, setProgBarrendero] = useState('Carmen Córdoba');
  const [filtroDias, setFiltroDias] = useState<number>(30);

  // Diseñador de Rutas por Calles (OSRM)
  const [disenadorPuntos, setDisenadorPuntos] = useState<[number, number][]>([]);
  const [trazadoCalculado, setTrazadoCalculado] = useState<any | null>(null);
  const [distanciaKm, setDistanciaKm] = useState<string | null>(null);
  const [duracionMin, setDuracionMin] = useState<number | null>(null);
  const [calculandoRuta, setCalculandoRuta] = useState(false);
  const [nuevaRutaNombre, setNuevaRutaNombre] = useState('');
  const [nuevaRutaComuna, setNuevaRutaComuna] = useState(COMUNAS_QUIBDO[1].nombre);
  const [nuevaRutaDias, setNuevaRutaDias] = useState('Martes, Jueves, Sábado');
  const [nuevaRutaHorario, setNuevaRutaHorario] = useState('19:00 - 22:30');

  // Despacho de PQRS
  const [cuadrillaInput, setCuadrillaInput] = useState('Cuadrilla Rápida #1');

  const refreshData = async () => {
    try {
      const [resFlota, resTurnos, resVehiculos, resRutas, resPqrs, resNov, resPlan, resEmp] = await Promise.all([
        api.getFlotaDetallada(),
        api.getTurnosActivos(),
        api.getVehiculos(),
        api.getRutas(),
        api.getPqrs(),
        api.getNovedades(),
        api.getTurnosPlanificados(),
        api.getEmpleados()
      ]);
      setFlotaDetallada(resFlota.data || []);
      setTurnosActivos(resTurnos.data || []);
      setVehiculos(resVehiculos.data || []);
      setRutas(resRutas.data || []);
      setPqrsList(resPqrs.data || []);
      setNovedades(resNov.data || []);
      setTurnosPlanificados(resPlan.data || []);
      setEmpleados(resEmp.data || []);

      if (resVehiculos.data?.length > 0 && !progVehiculo) setProgVehiculo(resVehiculos.data[0].id);
      if (resRutas.data?.length > 0 && !progRuta) setProgRuta(resRutas.data[0].id);
    } catch (err: any) {
      console.error('Error cargando despacho Aguas del Atrato:', err.message);
    }
  };

  useEffect(() => {
    refreshData();
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

    socket.on('flota:posicion', handleFlotaUpdate);
    return () => {
      socket.off('flota:posicion', handleFlotaUpdate);
    };
  }, []);

  // Guardar Turno en el Planificador (30 Días)
  const handleGuardarTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progRuta || !progVehiculo || !progConductor) {
      toast.error('Completa los campos obligatorios del turno.');
      return;
    }

    try {
      await api.planificarTurno({
        ruta_id: progRuta,
        vehiculo_id: progVehiculo,
        conductor_nombre: progConductor,
        ayudante_1: progAyudante1,
        ayudante_2: progAyudante2,
        barrendero: progBarrendero,
        fecha_programada: fechaProg,
        observaciones: 'Programación oficial Aguas del Atrato'
      });

      toast.success(`Turno programado exitosamente para el ${fechaProg}`);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Error al planificar turno');
    }
  };

  // Crear Empleado Manualmente
  const handleCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEmpDoc.trim() || !nuevoEmpNombre.trim() || !nuevoEmpCargo) {
      toast.error('Cédula, nombre y cargo son obligatorios');
      return;
    }
    try {
      await api.crearEmpleado({
        numero_documento: nuevoEmpDoc.trim(),
        nombre: nuevoEmpNombre.trim(),
        apellidos: nuevoEmpApellidos.trim(),
        cargo: nuevoEmpCargo,
        licencia_conduccion: nuevoEmpCargo === 'conductor' ? nuevoEmpLicencia : undefined,
        telefono: nuevoEmpTel.trim() || undefined,
        email: nuevoEmpEmail.trim() || undefined,
        password: nuevoEmpPass || '123456'
      });
      toast.success(`Empleado ${nuevoEmpNombre} registrado exitosamente en EPQ`);
      setIsModalCrearEmpOpen(false);
      setNuevoEmpDoc('');
      setNuevoEmpNombre('');
      setNuevoEmpApellidos('');
      setNuevoEmpTel('');
      setNuevoEmpEmail('');
      const res = await api.getEmpleados();
      setEmpleados(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear empleado');
    }
  };

  // Carga Masiva de Empleados
  const handleCargaMasiva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTexto.trim()) {
      toast.error('Por favor ingresa texto o datos de empleados en formato CSV');
      return;
    }
    try {
      const lineas = csvTexto.trim().split('\n');
      const empleadosAInsertar: any[] = [];
      for (const linea of lineas) {
        const trimmed = linea.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const partes = trimmed.split(',').map(p => p.trim());
        if (partes.length >= 3) {
          empleadosAInsertar.push({
            numero_documento: partes[0],
            nombre: partes[1],
            apellidos: partes[2] || '',
            cargo: (partes[3] || 'ayudante').toLowerCase(),
            telefono: partes[4] || '',
            email: partes[5] || '',
            licencia_conduccion: partes[6] || undefined,
            password: '123456'
          });
        }
      }

      if (empleadosAInsertar.length === 0) {
        toast.error('No se encontraron filas con formato válido. Usa: cédula, nombre, apellidos, cargo, teléfono, email, licencia');
        return;
      }

      const res = await api.cargaMasivaEmpleados(empleadosAInsertar);
      toast.success(`¡Carga masiva completada! ${res.insertados} empleados registrados.`);
      setIsModalCargaMasivaOpen(false);
      setCsvTexto('');
      const resEmp = await api.getEmpleados();
      setEmpleados(resEmp.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Error en carga masiva');
    }
  };

  // Cambiar Estado Empleado (Activar / Desactivar)
  const handleToggleEstadoEmpleado = async (emp: EmpleadoItem) => {
    const nuevoEstado = emp.estado === 'inactivo' ? 'activo' : 'inactivo';
    try {
      await api.actualizarEmpleado(emp.id, { estado: nuevoEstado });
      toast.success(`Empleado ${emp.nombre} ahora está ${nuevoEstado.toUpperCase()}`);
      const res = await api.getEmpleados();
      setEmpleados(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado del empleado');
    }
  };

  // Puntos de Referencia Quibdó para Diseñador
  const handleCargarPuntosDemo = () => {
    const puntosDemoQuibdo: [number, number][] = [
      [5.6948, -76.6612], // Malecón del Atrato
      [5.6930, -76.6585], // Catedral San Francisco de Asís (Calle 24)
      [5.6955, -76.6540], // Alameda Reyes
      [5.6980, -76.6520], // Entrada Huapango
      [5.7010, -76.6495]  // Huapango sector La Yesca
    ];
    setDisenadorPuntos(puntosDemoQuibdo);
    toast.info('Puntos de referencia de Quibdó cargados en el mapa.');
  };

  // Calcular Trazado OSRM por Calles
  const handleCalcularTrazado = async () => {
    if (disenadorPuntos.length < 2) {
      toast.error('Agrega al menos 2 puntos en el mapa para trazar una ruta.');
      return;
    }

    setCalculandoRuta(true);
    try {
      const res = await api.calcularTrazadoRuta(disenadorPuntos);
      setTrazadoCalculado(res.data.trazado_geojson);
      setDistanciaKm(res.data.distancia_km.toFixed(2));
      setDuracionMin(Math.round(res.data.duracion_min));
      toast.success(`Trazado vial OSRM calculado: ${res.data.distancia_km.toFixed(2)} km siguiendo las calles reales.`);
    } catch (err: any) {
      toast.error(err.message || 'Error al calcular ruta con OSRM');
    } finally {
      setCalculandoRuta(false);
    }
  };

  // Guardar nueva ruta en el catálogo de Quibdó
  const handleGuardarRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaRutaNombre) {
      toast.error('Ingresa un nombre para la ruta.');
      return;
    }
    if (!trazadoCalculado) {
      toast.error('Primero calcula el trazado por calles con el botón OSRM.');
      return;
    }

    try {
      await api.crearRuta({
        nombre: nuevaRutaNombre,
        comuna: nuevaRutaComuna,
        dias_servicio: nuevaRutaDias,
        horario_estimado: nuevaRutaHorario,
        trazado_geojson: trazadoCalculado
      });

      toast.success(`¡Ruta "${nuevaRutaNombre}" guardada exitosamente en el catálogo oficial de Quibdó!`);
      setNuevaRutaNombre('');
      setDisenadorPuntos([]);
      setTrazadoCalculado(null);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar ruta');
    }
  };

  // Asignar cuadrilla a PQRS
  const handleAsignarCuadrilla = async (pqrsId: string) => {
    try {
      await api.actualizarEstadoPqrs(
        pqrsId,
        EstadoPQRS.CUADRILLA_ASIGNADA,
        cuadrillaInput,
        'Cuadrilla despachada para recolección prioritaria en la esquina reportada.'
      );
      toast.success(`Cuadrilla asignada a reporte: ${cuadrillaInput}`);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar cuadrilla');
    }
  };

  // Resolver PQRS
  const handleResolverPqrs = async (pqrsId: string) => {
    try {
      await api.actualizarEstadoPqrs(
        pqrsId,
        EstadoPQRS.RESUELTA,
        undefined,
        'Limpieza culminada y escombros retirados con éxito.'
      );
      toast.success('Reporte marcado como RESUELTO');
      refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Error al resolver');
    }
  };

  // Filtrado de empleados para la tabla de Personal
  const empleadosFiltrados = empleados.filter((emp) => {
    if (filtroCargoEmp !== 'todos' && emp.cargo !== filtroCargoEmp) return false;
    if (filtroEstadoEmp !== 'todos' && emp.estado !== filtroEstadoEmp) return false;
    if (busquedaEmp.trim()) {
      const q = busquedaEmp.toLowerCase().trim();
      const nom = `${emp.nombre} ${emp.apellidos || ''}`.toLowerCase();
      const doc = (emp.numero_documento || '').toLowerCase();
      const tel = (emp.telefono || '').toLowerCase();
      return nom.includes(q) || doc.includes(q) || tel.includes(q);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '12px' }}>
      {/* Dashboard Top Header */}
      <div className="glass-panel" style={{
        padding: '14px 20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)'
          }}>
            <Building2 size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
              Empresas Públicas de Quibdó &bull; EPQ / Aguas del Atrato
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Consola Maestra de Operaciones, Planificación 30 Días, Cuadrillas y Rutas Viales
            </span>
          </div>
        </div>

        <button
          onClick={refreshData}
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
        >
          <RefreshCw size={14} />
          <span>Refrescar Datos</span>
        </button>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="grid-sidebar-layout">
        {/* Sidebar Menú */}
        <div className="glass-panel" style={{ padding: '14px', height: 'fit-content' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 800 }}>
            MÓDULOS ADMINISTRATIVOS EPQ
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => switchTab('multifleet')}
              className={`btn ${currentTab === 'multifleet' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.82rem' }}
            >
              <Compass size={16} />
              <span>Mapa Flota en Vivo</span>
            </button>

            <button
              onClick={() => switchTab('planificador')}
              className={`btn ${currentTab === 'planificador' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.82rem' }}
            >
              <CalendarDays size={16} />
              <span>Turnos & Cuadrillas (30 Días)</span>
            </button>

            <button
              onClick={() => switchTab('disenador')}
              className={`btn ${currentTab === 'disenador' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.82rem' }}
            >
              <Route size={16} />
              <span>Diseñar Rutas por Calles (OSRM)</span>
            </button>

            <button
              onClick={() => switchTab('empleados')}
              className={`btn ${currentTab === 'empleados' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.82rem' }}
            >
              <Users size={16} />
              <span>Personal & Cuadrillas ({empleados.length})</span>
            </button>

            <button
              onClick={() => switchTab('pqrs')}
              className={`btn ${currentTab === 'pqrs' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.82rem' }}
            >
              <FileText size={16} />
              <span>Despacho PQRS ({pqrsList.filter(p => p.estado !== 'resuelta').length})</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div>
          {/* TAB 1: MAPA MAESTRO MULTI-FLOTA */}
          {currentTab === 'multifleet' && (
            <div>
              {/* Resumen Métrico */}
              <div className="grid-responsive-4" style={{ marginBottom: '14px' }}>
                <div className="glass-panel" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Flota Total EPQ</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                    {flotaDetallada.length || vehiculos.length} Compactadores
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Activos en Vía Ahora</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                    {flotaDetallada.filter(f => f.estado_operativo === 'en_ruta').length || turnosActivos.length} en Ruta
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Disponibles en Base</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>
                    {flotaDetallada.filter(f => f.estado_operativo === 'disponible').length} en Patio
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Personal Registrado</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa' }}>
                    {empleados.length} Operarios
                  </div>
                </div>
              </div>

              {/* Mapa Maestro Satelital Multi-Flota */}
              <div style={{ marginBottom: '16px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <MapComponent
                  multiTrucks={turnosActivos.map(t => ({
                    id: t.id,
                    placa: t.vehiculo_codigo || t.vehiculo_placa,
                    lat: t.lat || 5.6940,
                    lng: t.lng || -76.6580,
                    rumbo: t.rumbo || 0,
                    velocidad: t.velocidad || 18,
                    avance: t.porcentaje_avance || 45
                  }))}
                  novedadesVia={novedades}
                  height="480px"
                />
              </div>

              {/* Tarjetas de Detalle de Flota Completa (Activos e Inactivos) */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={18} color="#38bdf8" />
                  <span>Estado Detallado de Flota & Tripulaciones (Quibdó):</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {(flotaDetallada.length > 0 ? flotaDetallada : vehiculos).map((veh) => {
                    const isEnRuta = veh.estado_operativo === 'en_ruta' || veh.estado === 'en_ruta';
                    return (
                      <div key={veh.id} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isEnRuta ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '10px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>
                            {veh.codigo} ({veh.placa})
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isEnRuta ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                            color: isEnRuta ? '#34d399' : '#93c5fd'
                          }}>
                            {isEnRuta ? '⚡ EN RUTA' : '🅿️ EN BASE'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Capacidad: <b>{veh.capacidad_ton} Ton</b> &bull; Odómetro: {veh.kilometraje_actual || '14,200'} km
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.74rem' }}>
                          <div>🚛 <b>Conductor:</b> {veh.conductor_nombre || 'Sin asignar'}</div>
                          {veh.ayudante_1 && (
                            <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                              🦺 <b>Ayudantes:</b> {veh.ayudante_1}, {veh.ayudante_2 || 'No asignado'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLANIFICADOR DE TURNOS (30 DÍAS) CON COMBOBOX AUTOCOMPLETE */}
          {currentTab === 'planificador' && (
            <div>
              <div className="glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CalendarDays size={20} color="#34d399" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 800 }}>
                    Programación Operativa de Turnos & Cuadrillas (Horizonte 30 Días)
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Asigna vehículos, rutas y cuadrillas de recolección oficiales. Los nombres de conductores y ayudantes se seleccionan con búsqueda en vivo desde el catálogo unificado de EPQ para evitar errores de digitación.
                </p>

                <form onSubmit={handleGuardarTurno}>
                  <div className="grid-responsive-3" style={{ gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Fecha de la Jornada:
                      </label>
                      <input
                        type="date"
                        className="input-control"
                        value={fechaProg}
                        onChange={(e) => setFechaProg(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Micro-Ruta Comunal:
                      </label>
                      <select
                        className="input-control"
                        value={progRuta}
                        onChange={(e) => setProgRuta(e.target.value)}
                        required
                      >
                        {rutas.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nombre} ({r.comuna})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Vehículo Compactador:
                      </label>
                      <select
                        className="input-control"
                        value={progVehiculo}
                        onChange={(e) => setProgVehiculo(e.target.value)}
                        required
                      >
                        {vehiculos.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.codigo} ({v.placa}) - {v.capacidad_ton} Ton
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cuadrilla Completa con Searchable Dropdowns */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={16} />
                        <span>Asignación de Personal con Autocompletado & Búsqueda:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchTab('empleados')}
                        style={{ background: 'none', border: 'none', color: '#34d399', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        + Gestionar personal en EPQ
                      </button>
                    </div>

                    <div className="grid-responsive-2" style={{ gap: '14px' }}>
                      {/* Conductor Selector */}
                      <EmployeeSelectCombobox
                        label="🚛 Conductor Titular (Licencia C2 / C3):"
                        value={progConductor}
                        onChange={(nombre) => setProgConductor(nombre)}
                        empleados={empleados}
                        cargoPreferido="conductor"
                        placeholder="Buscar conductor (ej. Ardis Díaz)..."
                        accentColor="#fbbf24"
                        required
                      />

                      {/* Ayudante 1 Selector */}
                      <EmployeeSelectCombobox
                        label="🦺 Ayudante 1 de Recolección (Cargue y Vaciado):"
                        value={progAyudante1}
                        onChange={(nombre) => setProgAyudante1(nombre)}
                        empleados={empleados}
                        cargoPreferido="ayudante"
                        placeholder="Buscar ayudante (ej. Hamilton Rivas)..."
                        accentColor="#34d399"
                        required
                      />

                      {/* Ayudante 2 Selector */}
                      <EmployeeSelectCombobox
                        label="🦺 Ayudante 2 de Recolección (Cargue y Vaciado):"
                        value={progAyudante2}
                        onChange={(nombre) => setProgAyudante2(nombre)}
                        empleados={empleados}
                        cargoPreferido="ayudante"
                        placeholder="Buscar segundo ayudante (ej. Jhon Jairo)..."
                        accentColor="#34d399"
                      />

                      {/* Barrendero Selector */}
                      <EmployeeSelectCombobox
                        label="🧹 Barrendero Oficial (Barrido y Aseo de Vías):"
                        value={progBarrendero}
                        onChange={(nombre) => setProgBarrendero(nombre)}
                        empleados={empleados}
                        cargoPreferido="barrendero"
                        placeholder="Buscar personal de barrido (ej. Carmen)..."
                        accentColor="#38bdf8"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 800 }}
                  >
                    <Save size={18} />
                    <span>Guardar Asignación de Turno & Cuadrilla</span>
                  </button>
                </form>
              </div>

              {/* Tabla de Turnos Planificados (Próximos 30 días) */}
              <div className="glass-panel" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>
                    Calendario de Turnos Programados ({turnosPlanificados.length} Registros):
                  </h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setFiltroDias(7)}
                      className={`btn ${filtroDias === 7 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    >
                      Próximos 7 Días
                    </button>
                    <button
                      onClick={() => setFiltroDias(30)}
                      className={`btn ${filtroDias === 30 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    >
                      Próximos 30 Días
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Fecha</th>
                        <th style={{ padding: '8px' }}>Ruta</th>
                        <th style={{ padding: '8px' }}>Vehículo</th>
                        <th style={{ padding: '8px' }}>Conductor</th>
                        <th style={{ padding: '8px' }}>Cuadrilla (Cargue & Barrido)</th>
                        <th style={{ padding: '8px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turnosPlanificados.map((tp) => (
                        <tr key={tp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px', fontWeight: 800, color: '#38bdf8' }}>
                            {tp.fecha_programada ? new Date(tp.fecha_programada).toLocaleDateString('es-CO') : 'Hoy'}
                          </td>
                          <td style={{ padding: '8px', color: '#f8fafc' }}>
                            {tp.ruta_nombre || 'Ruta Quibdó'}
                          </td>
                          <td style={{ padding: '8px' }}>
                            {tp.vehiculo_codigo || tp.vehiculo_id || 'COMP-01'}
                          </td>
                          <td style={{ padding: '8px', color: '#fbbf24', fontWeight: 700 }}>
                            {tp.conductor_nombre}
                          </td>
                          <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                            <div>🦺 {tp.ayudante_1 || 'Hamilton R.'}, {tp.ayudante_2 || 'Jhon M.'}</div>
                            <div>🧹 {tp.barrendero || 'Carmen C.'}</div>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: tp.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                              color: tp.estado === 'activo' ? '#34d399' : 'var(--text-muted)'
                            }}>
                              {(tp.estado || 'PROGRAMADO').toUpperCase()}
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

          {/* TAB 3: DISEÑADOR DE RUTAS POR CALLES (OSRM) */}
          {currentTab === 'disenador' && (
            <div>
              <div className="glass-panel" style={{ padding: '18px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Route size={22} color="#10b981" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 800 }}>
                      Diseñador de Rutas Sugeridas por Calles (Quibdó OSRM)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCargarPuntosDemo}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.76rem', color: '#38bdf8' }}
                  >
                    <Sparkles size={14} />
                    <span>Cargar Puntos de Referencia Quibdó</span>
                  </button>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Haz clic en el mapa en los puntos por donde debe circular el camión. Nuestro motor OSRM conectará los puntos siguiendo exactamente la malla vial y curvas de las calles de Quibdó (sin líneas rectas sobre casas ni ríos).
                </p>

                {/* Controles del Diseñador */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                      Puntos marcados: <b>{disenadorPuntos.length}</b>
                    </span>
                    {distanciaKm && (
                      <span className="badge badge-activo" style={{ fontSize: '0.75rem' }}>
                        📏 {distanciaKm} km &bull; ~{duracionMin} min estimados
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {disenadorPuntos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDisenadorPuntos([]);
                          setTrazadoCalculado(null);
                          setDistanciaKm(null);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.76rem', color: '#f87171' }}
                      >
                        <Trash2 size={13} />
                        <span>Limpiar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={disenadorPuntos.length < 2 || calculandoRuta}
                      onClick={handleCalcularTrazado}
                      className="btn btn-warning"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      <Zap size={14} />
                      <span>{calculandoRuta ? 'Calculando con OSRM...' : '⚡ Trazar por Calles (OSRM)'}</span>
                    </button>
                  </div>
                </div>

                {/* Mapa Interactivo para Puntos */}
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                  <MapComponent
                    height="420px"
                    onAddPoint={(lat, lng) => {
                      setDisenadorPuntos((prev) => [...prev, [lat, lng]]);
                      toast.info(`Punto agregado (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                    }}
                    customWaypoints={disenadorPuntos}
                    calculatedRouteGeoJSON={trazadoCalculado}
                  />
                </div>

                {/* Formulario para Guardar la Ruta en el Catálogo */}
                {trazadoCalculado && (
                  <form onSubmit={handleGuardarRuta} className="glass-panel" style={{ padding: '16px' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} />
                      <span>¡Trazado Vial Listo! Guardar en Catálogo Oficial de Quibdó:</span>
                    </h4>

                    <div className="grid-responsive-2" style={{ gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Nombre de la Micro-Ruta *:
                        </label>
                        <input
                          type="text"
                          className="input-control"
                          placeholder="Ej. Ruta Alameda Reyes - Huapango"
                          value={nuevaRutaNombre}
                          onChange={(e) => setNuevaRutaNombre(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Comuna Oficial de Quibdó:
                        </label>
                        <select
                          className="input-control"
                          value={nuevaRutaComuna}
                          onChange={(e) => setNuevaRutaComuna(e.target.value)}
                        >
                          {COMUNAS_QUIBDO.map(c => (
                            <option key={c.id} value={c.nombre}>{c.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Días de Operación:
                        </label>
                        <input
                          type="text"
                          className="input-control"
                          value={nuevaRutaDias}
                          onChange={(e) => setNuevaRutaDias(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Horario Estimado:
                        </label>
                        <input
                          type="text"
                          className="input-control"
                          value={nuevaRutaHorario}
                          onChange={(e) => setNuevaRutaHorario(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '10px', fontSize: '0.9rem', fontWeight: 800 }}
                    >
                      <Save size={16} />
                      <span>Guardar Ruta en el Catálogo de Quibdó</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PERSONAL & CUADRILLAS EPQ (GESTIÓN COMPLETA) */}
          {currentTab === 'empleados' && (
            <div>
              <div className="glass-panel" style={{ padding: '18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={22} color="#38bdf8" />
                      <span>Gestión de Personal & Cuadrillas Operativas EPQ</span>
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Administración exclusiva de conductores, ayudantes y cuadrillas de barrido para Aguas del Atrato.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setIsModalCrearEmpOpen(true)}
                      className="btn btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      <UserPlus size={15} />
                      <span>+ Registrar Empleado</span>
                    </button>
                    <button
                      onClick={() => setIsModalCargaMasivaOpen(true)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem', color: '#38bdf8' }}
                    >
                      <FileSpreadsheet size={15} />
                      <span>Carga Masiva (CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Filtros de Empleados */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ position: 'relative', flex: '1 1 200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="input-control"
                      style={{ paddingLeft: '32px', fontSize: '0.8rem' }}
                      placeholder="Buscar por nombre, cédula o teléfono..."
                      value={busquedaEmp}
                      onChange={(e) => setBusquedaEmp(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cargo:</span>
                    <select
                      className="input-control"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', width: 'auto' }}
                      value={filtroCargoEmp}
                      onChange={(e) => setFiltroCargoEmp(e.target.value)}
                    >
                      <option value="todos">Todos los Cargos</option>
                      <option value="conductor">Conductores</option>
                      <option value="ayudante">Ayudantes Recolección</option>
                      <option value="barrendero">Barrenderos</option>
                      <option value="supervisor">Supervisores</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estado:</span>
                    <select
                      className="input-control"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', width: 'auto' }}
                      value={filtroEstadoEmp}
                      onChange={(e) => setFiltroEstadoEmp(e.target.value)}
                    >
                      <option value="todos">Todos los Estados</option>
                      <option value="activo">Solo Activos</option>
                      <option value="inactivo">Solo Inactivos</option>
                    </select>
                  </div>
                </div>

                {/* Tabla de Empleados */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Empleado & Cédula</th>
                        <th style={{ padding: '10px' }}>Cargo Oficial</th>
                        <th style={{ padding: '10px' }}>Licencia</th>
                        <th style={{ padding: '10px' }}>Contacto</th>
                        <th style={{ padding: '10px' }}>Estado</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empleadosFiltrados.map((emp) => {
                        const isActivo = emp.estado !== 'inactivo';
                        return (
                          <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '10px' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                                {emp.nombre} {emp.apellidos || ''}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                CC: <b>{emp.numero_documento || 'No registrado'}</b>
                              </div>
                            </td>

                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                background: emp.cargo === 'conductor'
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : emp.cargo === 'supervisor'
                                  ? 'rgba(168, 85, 247, 0.2)'
                                  : emp.cargo === 'barrendero'
                                  ? 'rgba(56, 189, 248, 0.2)'
                                  : 'rgba(16, 185, 129, 0.2)',
                                color: emp.cargo === 'conductor'
                                  ? '#fbbf24'
                                  : emp.cargo === 'supervisor'
                                  ? '#c084fc'
                                  : emp.cargo === 'barrendero'
                                  ? '#38bdf8'
                                  : '#34d399'
                              }}>
                                {emp.cargo}
                              </span>
                            </td>

                            <td style={{ padding: '10px' }}>
                              {emp.licencia_conduccion ? (
                                <span style={{ fontWeight: 800, color: '#fbbf24', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {emp.licencia_conduccion}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-dim)' }}>N/A</span>
                              )}
                            </td>

                            <td style={{ padding: '10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              <div>📞 {emp.telefono || 'Sin celular'}</div>
                              <div>✉️ {emp.email || 'Sin correo'}</div>
                            </td>

                            <td style={{ padding: '10px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: isActivo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: isActivo ? '#34d399' : '#f87171'
                              }}>
                                {isActivo ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                            </td>

                            <td style={{ padding: '10px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleEstadoEmpleado(emp)}
                                className={`btn ${isActivo ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                              >
                                {isActivo ? 'Desactivar' : 'Activar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DESPACHO DE PQRS */}
          {currentTab === 'pqrs' && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 800 }}>
                    Bandeja de Incidencias Cívicas & Despacho de Cuadrillas
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Atención de puntos de basura y respuesta en terreno para los barrios de Quibdó
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cuadrilla por defecto:</span>
                  <input
                    type="text"
                    className="input-control"
                    style={{ width: '180px', padding: '4px 8px', fontSize: '0.75rem' }}
                    value={cuadrillaInput}
                    onChange={(e) => setCuadrillaInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pqrsList.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    No hay incidencias pendientes por resolver en este momento.
                  </div>
                ) : (
                  pqrsList.map((p) => (
                    <div key={p.id} style={{
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171'
                          }}>
                            {p.tipo_incidencia.toUpperCase().replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {new Date(p.creado_en).toLocaleString('es-CO')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#f8fafc', margin: '4px 0' }}>
                          {p.descripcion}
                        </div>
                        {p.cuadrilla_asignada && (
                          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
                            👷 Asignado a: <b>{p.cuadrilla_asignada}</b>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.estado !== 'cuadrilla_asignada' && p.estado !== 'resuelta' && (
                          <button
                            onClick={() => handleAsignarCuadrilla(p.id)}
                            className="btn btn-warning"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            <Send size={14} /> <span>Despachar Cuadrilla</span>
                          </button>
                        )}

                        {p.estado !== 'resuelta' && (
                          <button
                            onClick={() => handleResolverPqrs(p.id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            <CheckCircle2 size={14} /> <span>Marcar Resuelto</span>
                          </button>
                        )}

                        {p.estado === 'resuelta' && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.15)',
                            padding: '4px 10px',
                            borderRadius: '6px'
                          }}>
                            ✓ Limpieza Culminada
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: REGISTRAR EMPLEADO MANUAL */}
      {isModalCrearEmpOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px', position: 'relative' }}>
            <button
              onClick={() => setIsModalCrearEmpOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 14px', fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} color="#34d399" />
              <span>Alta de Nuevo Empleado EPQ</span>
            </h3>

            <form onSubmit={handleCrearEmpleado} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cédula / Documento de Identidad *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ej. 1077654321"
                  value={nuevoEmpDoc}
                  onChange={(e) => setNuevoEmpDoc(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nombre(s) *</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Ardis"
                    value={nuevoEmpNombre}
                    onChange={(e) => setNuevoEmpNombre(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Apellidos</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Díaz Mosquera"
                    value={nuevoEmpApellidos}
                    onChange={(e) => setNuevoEmpApellidos(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cargo Oficial *</label>
                  <select
                    className="input-control"
                    value={nuevoEmpCargo}
                    onChange={(e) => setNuevoEmpCargo(e.target.value)}
                  >
                    <option value="conductor">Conductor Compactador</option>
                    <option value="ayudante">Ayudante de Recolección</option>
                    <option value="barrendero">Personal de Barrido</option>
                    <option value="supervisor">Supervisor de Zona</option>
                  </select>
                </div>

                {nuevoEmpCargo === 'conductor' && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Categoría Licencia</label>
                    <select
                      className="input-control"
                      value={nuevoEmpLicencia}
                      onChange={(e) => setNuevoEmpLicencia(e.target.value)}
                    >
                      <option value="C2">C2 (Camión Rígido)</option>
                      <option value="C3">C3 (Articulado / Pesado)</option>
                      <option value="C1">C1 (Automóvil Público)</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Teléfono / Celular</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="3125559988"
                    value={nuevoEmpTel}
                    onChange={(e) => setNuevoEmpTel(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correo Electrónico</label>
                  <input
                    type="email"
                    className="input-control"
                    placeholder="empleado@epq.gov.co"
                    value={nuevoEmpEmail}
                    onChange={(e) => setNuevoEmpEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contraseña Inicial de Acceso</label>
                <input
                  type="text"
                  className="input-control"
                  value={nuevoEmpPass}
                  onChange={(e) => setNuevoEmpPass(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '10px', fontWeight: 800 }}>
                <Check size={16} />
                <span>Guardar y Habilitar Empleado</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CARGA MASIVA DE EMPLEADOS */}
      {isModalCargaMasivaOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2500,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '24px', position: 'relative' }}>
            <button
              onClick={() => setIsModalCargaMasivaOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={20} color="#38bdf8" />
              <span>Carga Masiva de Empleados (CSV / Texto)</span>
            </h3>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Pega filas separadas por comas en el formato: <br />
              <code>cédula, nombre, apellidos, cargo, teléfono, email, licencia</code>
            </p>

            <form onSubmit={handleCargaMasiva} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                className="input-control"
                rows={6}
                style={{ fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.4 }}
                placeholder={`1077991122, Jhon, Murillo, conductor, 3110001122, jhon@epq.co, C2\n1077993344, Yeison, Cuesta, ayudante, 3120003344, yeison@epq.co,\n1077995566, Marta, Rivas, barrendero, 3130005566, marta@epq.co,`}
                value={csvTexto}
                onChange={(e) => setCsvTexto(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCsvTexto(`1077881122, Juan Diego, Córdoba, conductor, 3112233445, juandiego@epq.co, C2\n1077882233, Robinson, Hinestroza, ayudante, 3123344556, robinson@epq.co,\n1077883344, Dora Inés, Asprilla, barrendero, 3145566778, dora@epq.co,`)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.74rem', color: '#38bdf8' }}
                >
                  Pegar Plantilla Demo
                </button>

                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontWeight: 800 }}>
                  <Check size={16} />
                  <span>Procesar e Importar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
