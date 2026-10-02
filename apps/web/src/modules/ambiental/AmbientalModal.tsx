import React, { useState, useEffect } from 'react';
import { api } from '../../shared/services/api.js';
import { useAuth } from '../../shared/contexts/AuthContext.js';
import { Waves, Recycle, AlertTriangle, Send, X } from 'lucide-react';
import { toast } from 'sonner';

interface AmbientalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'cuencas' | 'reciclaje';
}

export const AmbientalModal: React.FC<AmbientalModalProps> = ({ isOpen, onClose, defaultTab = 'cuencas' }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'cuencas' | 'reciclaje'>(defaultTab);

  // Cuencas
  const [alertasCuencas, setAlertasCuencas] = useState<any[]>([]);
  const [quebrada, setQuebrada] = useState<'la_yesca' | 'carano' | 'aurora'>('la_yesca');
  const [descripcionCuenca, setDescripcionCuenca] = useState('');
  const [nivelRiesgo, setNivelRiesgo] = useState<'normal' | 'precaucion' | 'alerta_critica'>('alerta_critica');

  // Reciclaje
  const [materiales, setMateriales] = useState<any[]>([]);
  const [tipoMaterial, setTipoMaterial] = useState('carton_papel');
  const [cantidadAprox, setCantidadAprox] = useState('');
  const [direccion, setDireccion] = useState('Huapango, Cra 4');
  const [contacto, setContacto] = useState(user?.telefono || '3125551234');

  const loadData = async () => {
    try {
      const [resCuencas, resReciclaje] = await Promise.all([
        api.getAlertasCuencas(),
        api.getMaterialReciclaje()
      ]);
      setAlertasCuencas(resCuencas.data);
      setMateriales(resReciclaje.data);
    } catch (err: any) {
      console.error('Error cargando ambiental:', err.message);
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCrearAlertaCuenca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcionCuenca) {
      toast.error('Por favor describe la situación en la quebrada');
      return;
    }
    try {
      await api.crearAlertaCuenca({
        quebrada,
        nivel_riesgo: nivelRiesgo,
        descripcion: descripcionCuenca,
        lat: 5.6925,
        lng: -76.6590
      });
      toast.success('¡Alerta de cuenca transmitida a Gestión del Riesgo y Aguas del Atrato!');
      setDescripcionCuenca('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al emitir alerta');
    }
  };

  const handleCrearReciclaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantidadAprox) {
      toast.error('Especifica la cantidad aproximada');
      return;
    }
    try {
      await api.crearMaterialReciclaje({
        tipo_material: tipoMaterial,
        cantidad_aprox: cantidadAprox,
        contacto,
        direccion,
        lat: 5.6950,
        lng: -76.6560,
        usuario_id: user?.id
      });
      toast.success('¡Material publicado para las asociaciones de recicladores de Quibdó!');
      setCantidadAprox('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al publicar material');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 10, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        position: 'relative'
      }}>
        {/* Close Button */}
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

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Waves size={24} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
              Gestión Ambiental Comunitaria (Quibdó)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Prevención de Inundaciones &bull; Quebradas La Yesca/Caraño &bull; Reciclaje
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(0,0,0,0.3)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '18px'
        }}>
          <button
            type="button"
            onClick={() => setTab('cuencas')}
            className={`btn ${tab === 'cuencas' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'center' }}
          >
            <Waves size={16} />
            <span>Alertas Cuencas</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('reciclaje')}
            className={`btn ${tab === 'reciclaje' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'center' }}
          >
            <Recycle size={16} />
            <span>Material Aprovechable</span>
          </button>
        </div>

        {/* Tab Cuencas */}
        {tab === 'cuencas' && (
          <div>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '0.8rem',
              color: '#fca5a5',
              display: 'flex',
              gap: '10px'
            }}>
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <div>
                <b>Canal Prioritario de Prevención de Inundaciones:</b>
                <br />Reporta represamientos por basuras o ramas en las quebradas de Quibdó antes de que inicien las fuertes lluvias tropicales.
              </div>
            </div>

            <form onSubmit={handleCrearAlertaCuenca} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quebrada Afectada:</label>
                  <select
                    className="input-control"
                    value={quebrada}
                    onChange={(e: any) => setQuebrada(e.target.value)}
                  >
                    <option value="la_yesca">Quebrada La Yesca</option>
                    <option value="carano">Quebrada Caraño</option>
                    <option value="aurora">Quebrada La Aurora</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nivel de Riesgo:</label>
                  <select
                    className="input-control"
                    value={nivelRiesgo}
                    onChange={(e: any) => setNivelRiesgo(e.target.value)}
                  >
                    <option value="alerta_critica">🔴 Alerta Crítica (Taponada)</option>
                    <option value="precaucion">🟡 Precaución (Acumulación)</option>
                    <option value="normal">🟢 Monitoreo Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Detalle del Represamiento:</label>
                <textarea
                  className="input-control"
                  rows={2}
                  placeholder="Ej. Taponamiento de botellas plásticas bajo el puente de Huapango..."
                  value={descripcionCuenca}
                  onChange={(e) => setDescripcionCuenca(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-danger" style={{ width: '100%' }}>
                <Send size={16} />
                <span>Emitir Alerta Preventiva Inmediata</span>
              </button>
            </form>

            {/* Listado de Alertas Activas */}
            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#f8fafc' }}>
              Puntos en Monitoreo por la Comunidad:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alertasCuencas.map((c) => (
                <div key={c.id} style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${c.nivel_riesgo === 'alerta_critica' ? '#ef4444' : '#f59e0b'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
                      Quebrada {c.quebrada.replace('_', ' ').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                      {c.nivel_riesgo}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {c.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Reciclaje */}
        {tab === 'reciclaje' && (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
              Publica material reciclable para que los <b>recuperadores ambientales de Quibdó</b> lo retiren en tu predio antes de que pase el compactador de basura:
            </p>

            <form onSubmit={handleCrearReciclaje} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tipo de Material:</label>
                  <select
                    className="input-control"
                    value={tipoMaterial}
                    onChange={(e) => setTipoMaterial(e.target.value)}
                  >
                    <option value="carton_papel">📦 Cartón & Papel</option>
                    <option value="plastico">🧴 Plásticos & Botellas</option>
                    <option value="metales_chatarra">⚙️ Metales & Chatarra</option>
                    <option value="vidrio">🍾 Vidrio</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cantidad Aprox:</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Ej. 3 bolsas / 10 kg"
                    value={cantidadAprox}
                    onChange={(e) => setCantidadAprox(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Dirección de Recogida:</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Barrio Huapango, Cra 4"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Contacto / Celular:</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="3125551234"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '4px' }}>
                <Recycle size={16} />
                <span>Publicar Material para Recicladores</span>
              </button>
            </form>

            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#f8fafc' }}>
              Materiales Disponibles en Quibdó:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {materiales.map((m) => (
                <div key={m.id} style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#38bdf8' }}>
                      {m.tipo_material.replace('_', ' ').toUpperCase()} &bull; {m.cantidad_aprox}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      📍 {m.direccion} &bull; Contacto: {m.contacto}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    Disponible
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
