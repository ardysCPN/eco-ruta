import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { toast } from 'sonner';

export interface Usuario {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email?: string | null;
  rol: 'ciudadano' | 'conductor' | 'operaciones' | 'alcaldia';
  barrio?: string | null;
  comuna?: string | null;
  numero_documento?: string | null;
  cargo?: string | null;
  licencia_conduccion?: string | null;
  estado?: string | null;
}

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (identificador: string, pass: string) => Promise<void>;
  registro: (data: any) => Promise<void>;
  loginConductorPin: (pin: string, vehiculoId: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (rol: 'publico' | 'ciudadano' | 'conductor' | 'operaciones' | 'alcaldia') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cuentas demo pre-configuradas para Quibdó
const DEMO_USERS: Record<string, Usuario> = {
  ciudadano: {
    id: 'd1000000-0000-0000-0000-000000000001',
    nombre: 'Katerine',
    apellidos: 'Rentería Córdoba',
    telefono: '3125551234',
    email: 'katerine.renteria@gmail.com',
    numero_documento: '1118889901',
    rol: 'ciudadano',
    barrio: 'Huapango',
    comuna: 'Comuna 2'
  },
  conductor: {
    id: 'd1000000-0000-0000-0000-000000000004',
    nombre: 'Ardis',
    apellidos: 'Díaz',
    telefono: '3134445566',
    email: 'ardis.diaz@aguasdelatrato.com',
    numero_documento: '1077112233',
    cargo: 'conductor',
    licencia_conduccion: 'C2',
    rol: 'conductor',
    barrio: 'El Jardín',
    comuna: 'Comuna 5'
  },
  operaciones: {
    id: 'd1000000-0000-0000-0000-000000000010',
    nombre: 'Ing. Dairon',
    apellidos: 'Moreno Asprilla',
    telefono: '3208889900',
    email: 'despacho@aguasdelatrato.com',
    numero_documento: '1077001122',
    cargo: 'supervisor',
    rol: 'operaciones',
    barrio: 'Centro',
    comuna: 'Comuna 1'
  },
  alcaldia: {
    id: 'd1000000-0000-0000-0000-000000000011',
    nombre: 'Dra. Luz Marina',
    apellidos: 'Mena Caicedo',
    telefono: '3114445566',
    email: 'medioambiente@quibdo-choco.gov.co',
    numero_documento: '1077223344',
    rol: 'alcaldia',
    barrio: 'Medrano',
    comuna: 'Comuna 3'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('eco_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    // Por defecto iniciar como Katerine Rentería (Ciudadana de Quibdó)
    return DEMO_USERS.ciudadano;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('eco_token') || 'demo-token';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('eco_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('eco_user');
    }
  }, [user]);

  const login = async (identificador: string, pass: string) => {
    try {
      const res = await api.login({ identificador, password: pass });
      setUser(res.data);
      setToken(res.token);
      localStorage.setItem('eco_token', res.token);
      toast.success(`¡Bienvenido a ECO-RUTA Quibdó, ${res.data.nombre}!`);
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión');
      throw err;
    }
  };

  const registro = async (data: any) => {
    try {
      const res = await api.registro(data);
      setUser(res.data);
      setToken(res.token);
      localStorage.setItem('eco_token', res.token);
      toast.success(`¡Cuenta cívica creada exitosamente! Bienvenido ${res.data.nombre}.`);
    } catch (err: any) {
      toast.error(err.message || 'Error en el registro');
      throw err;
    }
  };

  const loginConductorPin = async (pin: string, vehiculoId: string) => {
    try {
      const res = await api.loginConductorPin({ pin, vehiculo_id: vehiculoId });
      const conductorUser: Usuario = {
        id: res.data.conductor.id,
        nombre: res.data.conductor.nombre,
        apellidos: res.data.conductor.apellidos,
        telefono: res.data.conductor.telefono,
        rol: 'conductor'
      };
      setUser(conductorUser);
      setToken(res.token);
      localStorage.setItem('eco_token', res.token);
      toast.success(`Cabina autorizada: Conductor ${conductorUser.nombre} en ${res.data.vehiculo.codigo}.`);
    } catch (err: any) {
      toast.error(err.message || 'Error de PIN');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user');
    toast.info('Sesión cerrada correctamente');
  };

  const quickSwitchRole = (rol: 'publico' | 'ciudadano' | 'conductor' | 'operaciones' | 'alcaldia') => {
    if (rol === 'publico') {
      setUser(null);
      setToken(null);
      localStorage.removeItem('eco_token');
      localStorage.removeItem('eco_user');
      toast.info('Modo Público Cívico activado (sin sesión)');
      return;
    }

    const demo = DEMO_USERS[rol];
    if (demo) {
      setUser(demo);
      setToken(`demo-token-${rol}`);
      localStorage.setItem('eco_token', `demo-token-${rol}`);
      toast.success(`Perfil cambiado a: ${demo.nombre} (${rol.toUpperCase()})`);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      login,
      registro,
      loginConductorPin,
      logout,
      quickSwitchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
