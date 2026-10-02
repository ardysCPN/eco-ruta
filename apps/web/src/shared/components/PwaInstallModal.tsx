import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Detectar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Capturar evento de instalación nativo (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        toast.success('¡ECO-RUTA se instaló con éxito en tu dispositivo!');
        setDeferredPrompt(null);
        onClose();
      }
    } else {
      toast.info('Para instalar en este navegador, abre el menú de opciones (⋮) y selecciona "Instalar aplicación".');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '16px'
    }}>
      <div className="glass-panel modal-overlay-content" style={{ width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
            }}>
              <Smartphone size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc' }}>
                Instalar ECO-RUTA Quibdó
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
                App Móvil Oficial &bull; Sin descargas pesadas
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', borderRadius: '8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {isInstalled ? (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ margin: '0 0 4px', color: '#34d399' }}>¡Ya tienes la app instalada!</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Estás navegando en ECO-RUTA como una aplicación nativa en tu pantalla de inicio.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Instala ECO-RUTA directamente en la pantalla de inicio de tu celular o computador para recibir alertas de llegada de los compactadores en tiempo real, incluso sin abrir el navegador.
            </p>

            {/* Guía Específica para Dispositivos iOS / iPhone / Safari */}
            {isIOS ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🍎 Instrucciones para iPhone / iPad (Safari):</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                    <Share size={18} color="#38bdf8" />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#f8fafc' }}>
                    <b>Paso 1:</b> Toca el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba) en la barra inferior de Safari.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                    <PlusSquare size={18} color="#34d399" />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#f8fafc' }}>
                    <b>Paso 2:</b> Desplázate hacia abajo y selecciona la opción <b>"Agregar al inicio"</b>.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
                    <CheckCircle2 size={18} color="#fbbf24" />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#f8fafc' }}>
                    <b>Paso 3:</b> Toca <b>"Agregar"</b> en la esquina superior derecha. ¡Listo! Tendrás el icono de ECO-RUTA en tu pantalla.
                  </div>
                </div>
              </div>
            ) : (
              /* Instalación en 1-Clic para Android / Chrome / Edge / Windows / Mac */
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={handleInstallClick}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.9rem',
                    gap: '10px',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Download size={18} />
                  <span>Instalar ECO-RUTA en este Dispositivo</span>
                </button>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                  Compatible con Android, Google Chrome, Microsoft Edge y navegadores modernos.
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
