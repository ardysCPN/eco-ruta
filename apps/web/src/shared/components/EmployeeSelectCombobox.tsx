import React, { useState, useRef, useEffect } from 'react';
import { User, Check, Search, ChevronDown, X } from 'lucide-react';

export interface EmpleadoItem {
  id: string;
  nombre: string;
  apellidos?: string;
  numero_documento?: string;
  cargo: string;
  licencia_conduccion?: string;
  estado?: string;
  telefono?: string;
  email?: string;
}

interface EmployeeSelectComboboxProps {
  label: string;
  value: string;
  onChange: (nombreCompleto: string, empleado?: EmpleadoItem) => void;
  empleados: EmpleadoItem[];
  cargoPreferido?: 'conductor' | 'ayudante' | 'barrendero' | 'supervisor';
  placeholder?: string;
  required?: boolean;
  accentColor?: string;
}

export const EmployeeSelectCombobox: React.FC<EmployeeSelectComboboxProps> = ({
  label,
  value,
  onChange,
  empleados,
  cargoPreferido,
  placeholder = 'Buscar o seleccionar empleado...',
  required = false,
  accentColor = '#34d399'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click por fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar empleados por búsqueda y ordenar poniendo primero los del cargo preferido
  const query = searchTerm.toLowerCase().trim();
  const filtered = empleados.filter((emp) => {
    // Si está inactivo, no mostrarlo para nuevas asignaciones
    if (emp.estado === 'inactivo') return false;

    if (!query) return true;
    const nombreCompleto = `${emp.nombre} ${emp.apellidos || ''}`.toLowerCase();
    const doc = (emp.numero_documento || '').toLowerCase();
    const cargo = (emp.cargo || '').toLowerCase();
    return nombreCompleto.includes(query) || doc.includes(query) || cargo.includes(query);
  }).sort((a, b) => {
    if (cargoPreferido) {
      if (a.cargo === cargoPreferido && b.cargo !== cargoPreferido) return -1;
      if (b.cargo === cargoPreferido && a.cargo !== cargoPreferido) return 1;
    }
    return a.nombre.localeCompare(b.nombre);
  });

  const handleSelect = (emp: EmpleadoItem) => {
    const nombreCompleto = `${emp.nombre} ${emp.apellidos || ''}`.trim();
    onChange(nombreCompleto, emp);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <label style={{ fontSize: '0.76rem', color: accentColor, display: 'block', marginBottom: '4px', fontWeight: 700 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>

      {/* Input / Botón Desplegable */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input-control"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '7px 10px',
          background: isOpen ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isOpen ? accentColor : 'rgba(255,255,255,0.12)'}`,
          transition: 'all 0.15s ease',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <User size={15} style={{ color: accentColor, flexShrink: 0 }} />
          {value ? (
            <span style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {value}
            </span>
          ) : (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              title="Borrar selección"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            style={{
              color: 'var(--text-muted)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      </div>

      {/* Panel Desplegable con Filtro de Búsqueda */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1500,
            padding: '8px',
            maxHeight: '260px',
            overflowY: 'auto',
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(16px)',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Caja de Búsqueda en Vivo */}
          <div style={{ position: 'relative', marginBottom: '6px' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              autoFocus
              className="input-control"
              placeholder="Escribe nombre (ej. Ardis Díaz) o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                paddingLeft: '28px',
                fontSize: '0.78rem',
                paddingTop: '6px',
                paddingBottom: '6px',
                background: 'rgba(0,0,0,0.4)'
              }}
            />
          </div>

          {/* Lista de Empleados Filtrados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                No se encontraron empleados con ese criterio en Quibdó.
              </div>
            ) : (
              filtered.map((emp) => {
                const nombreCompleto = `${emp.nombre} ${emp.apellidos || ''}`.trim();
                const isSelected = value === nombreCompleto;
                const isPreferredCargo = cargoPreferido && emp.cargo === cargoPreferido;

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(255,255,255,0.02)',
                      border: isSelected
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid transparent',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#34d399' : '#f8fafc' }}>
                          {nombreCompleto}
                        </span>
                        {isPreferredCargo && (
                          <span style={{ fontSize: '0.62rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                            Sugerido
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {emp.numero_documento && <span>CC: <b>{emp.numero_documento}</b></span>}
                        <span>&bull;</span>
                        <span style={{ textTransform: 'capitalize' }}>{emp.cargo}</span>
                        {emp.licencia_conduccion && (
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                            (Lic. {emp.licencia_conduccion})
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={16} color="#34d399" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
