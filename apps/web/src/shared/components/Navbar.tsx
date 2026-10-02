import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Wifi, 
  WifiOff, 
  User, 
  LogIn, 
  LogOut, 
  Menu, 
  X,
  Compass,
  CalendarDays,
  Route,
  ClipboardList,
  Flame,
  FileCheck,
  Users,
  MapPin,
  Camera,
  Calendar,
  Navigation,
  Waves,
  Smartphone
} from 'lucide-react';
import { socket } from '../services/socket.js';
import { useAuth } from '../contexts/AuthContext.js';
import { PwaInstallModal } from './PwaInstallModal.js';
import { toast } from 'sonner';

interface NavbarProps {
  epqTab?: 'multifleet' | 'planificador' | 'disenador' | 'empleados' | 'pqrs';
  onSelectEpqTab?: (tab: 'multifleet' | 'planificador' | 'disenador' | 'empleados' | 'pqrs') => void;
  alcaldiaTab?: 'pqrs' | 'zonas_rojas' | 'pgirs';
  onSelectAlcaldiaTab?: (tab: 'pqrs' | 'zonas_rojas' | 'pgirs') => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  epqTab = 'multifleet',
  onSelectEpqTab,
  alcaldiaTab = 'pqrs',
  onSelectAlcaldiaTab,
  onOpenAuth 
}) => {
  const { user, logout, quickSwitchRole } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showDemoSubmenu, setShowDemoSubmenu] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  const openCitizenModal = (modalName: string) => {
    setIsMobileMenuOpen(false);
    window.dispatchEvent(new CustomEvent('eco:open-modal', { detail: modalName }));
  };

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const rol = user?.rol || 'publico';

  return (
    <>
      <header className="glass-panel" style={{
        margin: '10px 12px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        position: 'relative'
      }}>
        {/* Identidad de Marca Quibdó con Botón Hamburguesa al lado izquierdo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Botón Hamburguesa Lateral (Lado Izquierdo) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn btn-secondary"
            style={{ 
              padding: '7px 10px', 
              borderRadius: '8px', 
              background: isMobileMenuOpen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              flexShrink: 0
            }}
            aria-label="Abrir menú lateral"
            title="Abrir menú de opciones"
          >
            {isMobileMenuOpen ? <X size={20} color="#34d399" /> : <Menu size={20} />}
          </button>

          <div style={{
            width: '38px',
            height: '38px',
            minWidth: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
          }}>
            <Truck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="brand-title" style={{ fontSize: '1.2rem', color: '#f8fafc', fontWeight: 800 }}>
                ECO-RUTA
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                QUIBDÓ
              </span>

              {/* Badge de Rol Estricto (Oculto en móvil para no desbordar) */}
              {rol === 'publico' && (
                <span className="hide-mobile" style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  PORTAL PÚBLICO
                </span>
              )}
              {rol === 'ciudadano' && (
                <span className="hide-mobile" style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  CIUDADANO
                </span>
              )}
              {rol === 'conductor' && (
                <span className="hide-mobile" style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  CABINA CONDUCTOR
                </span>
              )}
              {rol === 'operaciones' && (
                <span className="hide-mobile" style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#a78bfa',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  EPQ &bull; AGUAS DEL ATRATO
                </span>
              )}
              {rol === 'alcaldia' && (
                <span className="hide-mobile" style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(14, 165, 233, 0.3)'
                }}>
                  ALCALDÍA DE QUIBDÓ
                </span>
              )}
            </div>
            <span className="hide-mobile" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {rol === 'publico' && 'Consulta de Rutas y Compactadores en Vivo (Sin Sesión)'}
              {rol === 'ciudadano' && `Residente: ${user?.nombre} &bull; ${user?.barrio || 'Quibdó'}`}
              {rol === 'conductor' && `Conductor: ${user?.nombre} &bull; Compactador COMP-01`}
              {rol === 'operaciones' && 'Consola Administrativa &bull; Empresas Públicas de Quibdó'}
              {rol === 'alcaldia' && 'Consola de Supervisión &bull; Secretaría de Medio Ambiente'}
            </span>
          </div>
        </div>

        {/* Sub-navegación específica por rol (Desktop) */}
        {rol === 'operaciones' && onSelectEpqTab && (
          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => onSelectEpqTab('multifleet')}
              className={`btn ${epqTab === 'multifleet' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              <Compass size={14} />
              <span>Mapa Flota</span>
            </button>
            <button
              onClick={() => onSelectEpqTab('planificador')}
              className={`btn ${epqTab === 'planificador' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              <CalendarDays size={14} />
              <span>Turnos 30 Días</span>
            </button>
            <button
              onClick={() => onSelectEpqTab('disenador')}
              className={`btn ${epqTab === 'disenador' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              <Route size={14} />
              <span>Diseñar Ruta</span>
            </button>
            <button
              onClick={() => onSelectEpqTab('empleados')}
              className={`btn ${epqTab === 'empleados' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              <Users size={14} />
              <span>Personal & Cuadrillas</span>
            </button>
            <button
              onClick={() => onSelectEpqTab('pqrs')}
              className={`btn ${epqTab === 'pqrs' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              <ClipboardList size={14} />
              <span>Despacho PQRS</span>
            </button>
          </nav>
        )}

        {rol === 'alcaldia' && onSelectAlcaldiaTab && (
          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => onSelectAlcaldiaTab('pqrs')}
              className={`btn ${alcaldiaTab === 'pqrs' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              <ClipboardList size={14} />
              <span>Auditoría PQRS</span>
            </button>
            <button
              onClick={() => onSelectAlcaldiaTab('zonas_rojas')}
              className={`btn ${alcaldiaTab === 'zonas_rojas' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              <Flame size={14} />
              <span>Zonas Críticas</span>
            </button>
            <button
              onClick={() => onSelectAlcaldiaTab('pgirs')}
              className={`btn ${alcaldiaTab === 'pgirs' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px', fontSize: '0.76rem' }}
            >
              <FileCheck size={14} />
              <span>PGIRS Quibdó</span>
            </button>
          </nav>
        )}

        {/* Controles de Sesión, Switcher Rápido & Simulador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Indicador de conexión WebSocket */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: isConnected ? '#34d399' : '#ef4444' }}>
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {isConnected && <span className="pulse-dot"></span>}
          </div>

          {/* Botón PWA Desktop */}
          <button
            onClick={() => setShowPwaModal(true)}
            className="btn btn-secondary hide-mobile"
            style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}
            title="Instalar ECO-RUTA en tu dispositivo"
          >
            <Smartphone size={13} color="#34d399" />
            <span>📲 Instalar App</span>
          </button>

          {/* Selector Rápido de Rol de Prueba (Dropdown) */}
          <div style={{ position: 'relative' }} className="hide-mobile">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)' }}
              title="Cambiar vista para pruebas"
            >
              <span>Vistas Demo ▾</span>
            </button>

            {showRoleMenu && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'rgba(15, 23, 42, 0.98)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  zIndex: 2100,
                  minWidth: '220px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', padding: '4px 8px' }}>
                  CAMBIAR ROL PARA PRUEBAS:
                </div>
                <button
                  onClick={() => { quickSwitchRole('publico'); setShowRoleMenu(false); }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.75rem', border: 'none' }}
                >
                  🌐 Modo Público (Sin sesión)
                </button>
                <button
                  onClick={() => { quickSwitchRole('ciudadano'); setShowRoleMenu(false); }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.75rem', border: 'none' }}
                >
                  👤 Ciudadano (Dra. Mayerli)
                </button>
                <button
                  onClick={() => { quickSwitchRole('conductor'); setShowRoleMenu(false); }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.75rem', border: 'none' }}
                >
                  🚛 Conductor (Carlos Palacios)
                </button>
                <button
                  onClick={() => { quickSwitchRole('operaciones'); setShowRoleMenu(false); }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.75rem', border: 'none' }}
                >
                  🏢 EPQ (Aguas del Atrato)
                </button>
                <button
                  onClick={() => { quickSwitchRole('alcaldia'); setShowRoleMenu(false); }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.75rem', border: 'none' }}
                >
                  🏛️ Alcaldía de Quibdó
                </button>
              </div>
            )}
          </div>

          {/* Botón de Cuenta / Login */}
          <div className="hide-mobile">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={onOpenAuth}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.76rem', background: 'rgba(255,255,255,0.06)' }}
                  title="Ajustes de cuenta"
                >
                  <User size={13} color="#38bdf8" />
                  <span>{user.nombre.split(' ')[0]}</span>
                </button>
                <button
                  onClick={logout}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  title="Cerrar sesión"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <LogIn size={13} />
                <span>Ingresar / Registro</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Cajón Lateral Izquierdo (Mismo lado del botón Hamburguesa) */}
      {isMobileMenuOpen && (
        <>
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 2050,
              backdropFilter: 'blur(5px)'
            }}
          />

          <div className="mobile-nav-drawer" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: 'min(330px, 86vw)',
            height: '100vh',
            background: 'rgba(11, 19, 25, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '10px 0 35px rgba(0,0,0,0.7)',
            zIndex: 2100,
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            {/* Header del Menú Lateral con Perfil de Usuario */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: user ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  color: '#ffffff',
                  boxShadow: user ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none'
                }}>
                  {user ? (user.nombre.charAt(0) || 'U') : '👤'}
                </div>
                <div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                    {user ? `Hola, ${user.nombre}` : 'Bienvenido a ECO-RUTA'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {user ? `📍 ${user.barrio || 'Quibdó, Chocó'}` : 'Plataforma Quibdó Limpia'}
                  </div>
                  {user && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399'
                    }}>
                      {user.rol.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menús de Navegación Ciudadanos (Estructurados verticalmente, uno arriba del otro) */}
            {(rol === 'ciudadano' || rol === 'publico') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '2px' }}>
                  SERVICIOS Y CONSULTA:
                </span>

                {/* 1. Mapa en Vivo */}
                <button
                  onClick={() => openCitizenModal('mapa')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={17} color="#34d399" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#34d399' }}>Mapa en Vivo</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Seguimiento del camión y tiempo de llegada</div>
                  </div>
                </button>

                {/* 2. Mis Predios */}
                {rol === 'ciudadano' && (
                  <button
                    onClick={() => openCitizenModal('predios')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={17} color="#38bdf8" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>Mis Predios Privados</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Casa, Negocio o Predio Familiar (máx 3)</div>
                    </div>
                  </button>
                )}

                {/* 3. PQRS */}
                <button
                  onClick={() => {
                    if (rol === 'publico') {
                      toast.info('Inicia sesión para reportar incidencias con GPS.');
                      setIsMobileMenuOpen(false);
                      onOpenAuth();
                    } else {
                      openCitizenModal('pqrs');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Camera size={17} color="#ef4444" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>Reportar Incidencia (PQRS)</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reporte cívico con foto y GPS al despacho</div>
                  </div>
                </button>

                {/* 4. Horarios */}
                <button
                  onClick={() => openCitizenModal('horarios')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={17} color="#fbbf24" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>Horarios y Frecuencias</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Frecuencias oficiales por comuna en Quibdó</div>
                  </div>
                </button>

                {/* 5. Itinerario */}
                <button
                  onClick={() => openCitizenModal('itinerario')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Navigation size={17} color="#06b6d4" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>Itinerario Calle por Calle</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Calle 31, Malecón, Calle 24 hacia Mercado</div>
                  </div>
                </button>

                {/* 6. Quebradas */}
                <button
                  onClick={() => openCitizenModal('ambiental')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Waves size={17} color="#38bdf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>Monitoreo Quebradas</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cuencas del Río Atrato y alerta de lluvias</div>
                  </div>
                </button>

                {/* 7. Instalar Aplicación Móvil PWA */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowPwaModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.28) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginTop: '4px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
                  }}
                >
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Smartphone size={18} color="#34d399" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📲 Instalar Aplicación</span>
                      <span style={{ fontSize: '0.6rem', background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>PWA</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)' }}>Instalar en iPhone, iPad, Android o PC</div>
                  </div>
                </button>
              </div>
            )}

            {/* Sub-navegación móvil según rol de operaciones */}
            {rol === 'operaciones' && onSelectEpqTab && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>MÓDULOS OPERACIONES EPQ:</span>
                <button
                  onClick={() => { onSelectEpqTab('multifleet'); setIsMobileMenuOpen(false); }}
                  className={`btn ${epqTab === 'multifleet' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '10px' }}
                >
                  <Compass size={16} />
                  <span>Mapa Maestro Flota</span>
                </button>
                <button
                  onClick={() => { onSelectEpqTab('planificador'); setIsMobileMenuOpen(false); }}
                  className={`btn ${epqTab === 'planificador' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '10px' }}
                >
                  <CalendarDays size={16} />
                  <span>Planificador de Turnos (30 Días)</span>
                </button>
                <button
                  onClick={() => { onSelectEpqTab('disenador'); setIsMobileMenuOpen(false); }}
                  className={`btn ${epqTab === 'disenador' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '10px' }}
                >
                  <Route size={16} />
                  <span>Diseñador de Rutas por Calles</span>
                </button>
                <button
                  onClick={() => { onSelectEpqTab('empleados'); setIsMobileMenuOpen(false); }}
                  className={`btn ${epqTab === 'empleados' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '10px' }}
                >
                  <Users size={16} />
                  <span>Personal & Cuadrillas EPQ</span>
                </button>
                <button
                  onClick={() => { onSelectEpqTab('pqrs'); setIsMobileMenuOpen(false); }}
                  className={`btn ${epqTab === 'pqrs' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '10px' }}
                >
                  <ClipboardList size={16} />
                  <span>Despacho PQRS</span>
                </button>
              </div>
            )}

            {/* Sub-navegación móvil según rol de alcaldía */}
            {rol === 'alcaldia' && onSelectAlcaldiaTab && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>MÓDULOS ALCALDÍA:</span>
                <button
                  onClick={() => { onSelectAlcaldiaTab('pqrs'); setIsMobileMenuOpen(false); }}
                  className={`btn ${alcaldiaTab === 'pqrs' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '10px' }}
                >
                  <ClipboardList size={16} />
                  <span>Auditoría PQRS</span>
                </button>
                <button
                  onClick={() => { onSelectAlcaldiaTab('zonas_rojas'); setIsMobileMenuOpen(false); }}
                  className={`btn ${alcaldiaTab === 'zonas_rojas' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '10px' }}
                >
                  <Flame size={16} />
                  <span>Zonas Críticas</span>
                </button>
                <button
                  onClick={() => { onSelectAlcaldiaTab('pgirs'); setIsMobileMenuOpen(false); }}
                  className={`btn ${alcaldiaTab === 'pgirs' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', padding: '10px' }}
                >
                  <FileCheck size={16} />
                  <span>PGIRS Quibdó</span>
                </button>
              </div>
            )}

            {/* Submenú Colapsable para Vistas Demo (No apiñado) */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginBottom: '14px' }}>
              <button
                onClick={() => setShowDemoSubmenu(!showDemoSubmenu)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}
              >
                <span>🧪 Vistas Demo para Pruebas</span>
                <span>{showDemoSubmenu ? '▲' : '▼'}</span>
              </button>

              {showDemoSubmenu && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', paddingLeft: '6px' }}>
                  <button
                    onClick={() => { quickSwitchRole('publico'); setIsMobileMenuOpen(false); }}
                    className={`btn ${rol === 'publico' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: '0.74rem' }}
                  >
                    🌐 Portal Público (Sin sesión)
                  </button>
                  <button
                    onClick={() => { quickSwitchRole('ciudadano'); setIsMobileMenuOpen(false); }}
                    className={`btn ${rol === 'ciudadano' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: '0.74rem' }}
                  >
                    👤 Ciudadano (Dra. Mayerli Córdoba)
                  </button>
                  <button
                    onClick={() => { quickSwitchRole('conductor'); setIsMobileMenuOpen(false); }}
                    className={`btn ${rol === 'conductor' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: '0.74rem' }}
                  >
                    🚛 Conductor (Carlos Palacios)
                  </button>
                  <button
                    onClick={() => { quickSwitchRole('operaciones'); setIsMobileMenuOpen(false); }}
                    className={`btn ${rol === 'operaciones' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: '0.74rem' }}
                  >
                    🏢 EPQ (Aguas del Atrato)
                  </button>
                  <button
                    onClick={() => { quickSwitchRole('alcaldia'); setIsMobileMenuOpen(false); }}
                    className={`btn ${rol === 'alcaldia' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start', padding: '7px 10px', fontSize: '0.74rem' }}
                  >
                    🏛️ Alcaldía de Quibdó
                  </button>
                </div>
              )}
            </div>

            {/* Footer de Sesión */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
              {user ? (
                <button
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '10px' }}
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              ) : (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onOpenAuth(); }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <LogIn size={16} />
                  <span>Iniciar Sesión / Registro</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de Instalación PWA (con guía para iOS Safari y Android) */}
      <PwaInstallModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
      />
    </>
  );
};
