import React, { useState } from 'react';
import { Navbar } from './shared/components/Navbar.js';
import { ConductorView } from './modules/conductor/ConductorView.js';
import { CiudadanoView } from './modules/ciudadano/CiudadanoView.js';
import { OperacionesView } from './modules/operaciones/OperacionesView.js';
import { AlcaldiaView } from './modules/alcaldia/AlcaldiaView.js';
import { AuthProvider, useAuth } from './shared/contexts/AuthContext.js';
import { LoginModal } from './modules/auth/LoginModal.js';
import { Toaster } from 'sonner';

export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [epqTab, setEpqTab] = useState<'multifleet' | 'planificador' | 'disenador' | 'empleados' | 'pqrs'>('multifleet');
  const [alcaldiaTab, setAlcaldiaTab] = useState<'pqrs' | 'zonas_rojas' | 'pgirs'>('pqrs');

  const rol = user?.rol || 'publico';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toaster 
        richColors 
        closeButton
        position="bottom-right" 
        theme="dark"
        visibleToasts={2}
        duration={5500}
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            fontSize: '0.84rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }
        }}
      />

      <Navbar 
        epqTab={epqTab}
        onSelectEpqTab={setEpqTab}
        alcaldiaTab={alcaldiaTab}
        onSelectAlcaldiaTab={setAlcaldiaTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main style={{ flex: 1, padding: (rol === 'publico' || rol === 'ciudadano') ? 0 : '0 8px 30px', overflow: (rol === 'publico' || rol === 'ciudadano') ? 'hidden' : 'visible', position: 'relative' }}>
        {rol === 'publico' && (
          <CiudadanoView isPublic={true} onOpenAuth={() => setIsAuthOpen(true)} />
        )}
        {rol === 'ciudadano' && (
          <CiudadanoView isPublic={false} onOpenAuth={() => setIsAuthOpen(true)} />
        )}
        {rol === 'conductor' && (
          <ConductorView />
        )}
        {rol === 'operaciones' && (
          <OperacionesView activeTab={epqTab} onTabChange={setEpqTab} />
        )}
        {rol === 'alcaldia' && (
          <AlcaldiaView activeTab={alcaldiaTab} onTabChange={setAlcaldiaTab} />
        )}
      </main>

      <LoginModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />

      {rol !== 'publico' && rol !== 'ciudadano' && (
        <footer style={{
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(11, 19, 25, 0.95)'
        }}>
          ECO-RUTA Quibdó &bull; Telemetría Espacial PostGIS 16 &bull; Aguas del Atrato E.S.P. &bull; Alcaldía Municipal de Quibdó, Chocó
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
