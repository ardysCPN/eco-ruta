import React, { useState } from 'react';
import { useAuth } from '../../shared/contexts/AuthContext.js';
import { Phone, KeyRound, Truck, X, Sparkles, CreditCard, Mail, CheckCircle2 } from 'lucide-react';
import { COMUNAS_QUIBDO } from '@eco-ruta/shared';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'registro';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, registro, quickSwitchRole } = useAuth();
  const [tab, setTab] = useState<'login' | 'registro'>(defaultTab);

  // Form states - Login Inteligente
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states - Registro Ciudadano
  const [numDocumento, setNumDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [comunaSeleccionada, setComunaSeleccionada] = useState(COMUNAS_QUIBDO[0].nombre);
  const [barrio, setBarrio] = useState(COMUNAS_QUIBDO[0].barrios[0]);
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  // Barrios disponibles para la comuna seleccionada
  const comunaObj = COMUNAS_QUIBDO.find(c => c.nombre === comunaSeleccionada) || COMUNAS_QUIBDO[0];
  const barriosDisponibles = comunaObj.barrios;

  const handleSmartLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim() || !password) {
      toast.error('Por favor ingresa tu identificación (cédula, celular o correo) y contraseña');
      return;
    }
    try {
      setIsLoading(true);
      await login(identificador.trim(), password);
      onClose();
    } catch (err) {
      // Error handled by AuthContext toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistroCiudadano = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numDocumento.trim() || !nombre.trim() || !telefono.trim() || !email.trim() || !regPassword) {
      toast.error('Por favor completa todos los campos obligatorios (*)');
      return;
    }
    try {
      setIsLoading(true);
      await registro({
        numero_documento: numDocumento.trim(),
        nombre: nombre.trim(),
        apellidos: apellidos.trim() || 'Quibdó',
        telefono: telefono.trim(),
        email: email.trim(),
        barrio: barrio.trim(),
        comuna: comunaSeleccionada,
        password: regPassword,
        rol: 'ciudadano'
      });
      onClose();
    } catch (err) {
      // Error handled by AuthContext toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 10, 15, 0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '16px'
    }}>
      <div className="glass-panel modal-overlay-content" style={{
        width: '100%',
        maxWidth: '480px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '24px',
        position: 'relative',
        animation: 'fadeIn 0.25s ease'
      }}>
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
            marginBottom: '8px'
          }}>
            <Truck size={24} color="#ffffff" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc', fontWeight: 800 }}>
            ECO-RUTA QUIBDÓ
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Aguas del Atrato &bull; Alcaldía de Quibdó
          </p>
        </div>

        {/* Pestañas Principales: Iniciar Sesión / Registro Ciudadano */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'rgba(0,0,0,0.3)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '18px'
        }}>
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`btn ${tab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 12px', fontSize: '0.82rem', justifyContent: 'center', fontWeight: 700 }}
          >
            <KeyRound size={15} />
            <span>Iniciar Sesión</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('registro')}
            className={`btn ${tab === 'registro' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 12px', fontSize: '0.82rem', justifyContent: 'center', fontWeight: 700 }}
          >
            <Sparkles size={15} />
            <span>Registro Ciudadano</span>
          </button>
        </div>

        {/* TAB 1: INICIAR SESIÓN INTELIGENTE (Detecta rol automáticamente) */}
        {tab === 'login' && (
          <form onSubmit={handleSmartLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.76rem',
              color: '#a7f3d0',
              lineHeight: 1.4
            }}>
              <strong>✨ Detección Automática de Rol:</strong> Ingresa tu identificación (cédula, celular o correo). El sistema detecta si eres <b>Ciudadano</b>, <b>Conductor/Cuadrilla</b>, <b>Despacho EPQ</b> o <b>Alcaldía</b> y te dirige a tu consola.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Cédula, Celular o Correo Electrónico:
              </label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Ej. 1077432101, 3125551234 o correo"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Contraseña de Acceso:
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Tu contraseña registrada"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '10px', fontSize: '0.9rem', fontWeight: 700 }}
            >
              {isLoading ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Acceder a Mi Panel</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: REGISTRO CIUDADANO */}
        {tab === 'registro' && (
          <form onSubmit={handleRegistroCiudadano} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '0.74rem',
              color: '#bae6fd',
              lineHeight: 1.35
            }}>
              <b>ℹ️ Registro exclusivo para Ciudadanos:</b> Conductores, ayudantes y cuadrillas son registrados exclusivamente por <b>Empresas Públicas de Quibdó (EPQ)</b> desde el portal de administración.
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cédula / Documento de Identidad *</label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: '32px' }}
                  placeholder="Ej. 1077432101"
                  value={numDocumento}
                  onChange={(e) => setNumDocumento(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nombre(s) *</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Katerine"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Apellidos</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Rentería Córdoba"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Celular * (Único)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-control"
                    style={{ paddingLeft: '30px' }}
                    placeholder="3125551234"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correo * (Único)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="input-control"
                    style={{ paddingLeft: '30px' }}
                    placeholder="usuario@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comuna Oficial Quibdó</label>
                <select
                  className="input-control"
                  value={comunaSeleccionada}
                  onChange={(e) => {
                    const nuevaComuna = e.target.value;
                    setComunaSeleccionada(nuevaComuna);
                    const obj = COMUNAS_QUIBDO.find(c => c.nombre === nuevaComuna);
                    if (obj && obj.barrios.length > 0) {
                      setBarrio(obj.barrios[0]);
                    }
                  }}
                >
                  {COMUNAS_QUIBDO.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Barrio Asignado</label>
                <select
                  className="input-control"
                  value={barrio}
                  onChange={(e) => setBarrio(e.target.value)}
                >
                  {barriosDisponibles.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crear Contraseña *</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-control"
                  style={{ paddingLeft: '32px' }}
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '10px', fontWeight: 700 }}
            >
              {isLoading ? (
                <span>Creando cuenta cívica...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Registrar Mi Cuenta Cívica</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Sección de Demos y Acceso Rápido */}
        <div style={{
          marginTop: '18px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.73rem',
          color: 'var(--text-dim)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Acceso Rápido / Demostración:</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-primary)' }}>Para revisión y evaluación</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))', gap: '5px' }}>
            <button
              type="button"
              onClick={() => { quickSwitchRole('publico'); onClose(); }}
              className="btn btn-secondary"
              title="Vista cívica pública sin alertas privadas"
              style={{ padding: '5px 4px', fontSize: '0.68rem', justifyContent: 'center' }}
            >
              🌐 Público
            </button>
            <button
              type="button"
              onClick={() => { quickSwitchRole('ciudadano'); onClose(); }}
              className="btn btn-secondary"
              title="Residente Katerine Rentería (Huapango)"
              style={{ padding: '5px 4px', fontSize: '0.68rem', justifyContent: 'center' }}
            >
              👤 Ciudadano
            </button>
            <button
              type="button"
              onClick={() => { quickSwitchRole('conductor'); onClose(); }}
              className="btn btn-secondary"
              title="Cabina Conductor Yesid / Ardis Díaz"
              style={{ padding: '5px 4px', fontSize: '0.68rem', justifyContent: 'center' }}
            >
              🚛 Conductor
            </button>
            <button
              type="button"
              onClick={() => { quickSwitchRole('operaciones'); onClose(); }}
              className="btn btn-secondary"
              title="Aguas del Atrato EPQ (Despacho y Personal)"
              style={{ padding: '5px 4px', fontSize: '0.68rem', justifyContent: 'center' }}
            >
              🏢 EPQ Despacho
            </button>
            <button
              type="button"
              onClick={() => { quickSwitchRole('alcaldia'); onClose(); }}
              className="btn btn-secondary"
              title="Alcaldía de Quibdó (Fiscalización PGIRS)"
              style={{ padding: '5px 4px', fontSize: '0.68rem', justifyContent: 'center' }}
            >
              🏛️ Alcaldía
            </button>
          </div>

          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '2px' }}>
            Cuentas pre-cargadas (contraseña <code>123456</code>): Katerine (<code>1118889901</code>) &bull; Ardis Díaz (<code>1077112233</code>) &bull; EPQ (<code>1077001122</code>) &bull; Alcaldía (<code>1077223344</code>)
          </div>
        </div>
      </div>
    </div>
  );
};
