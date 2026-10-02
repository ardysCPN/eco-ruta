export interface ComunaQuibdo {
  id: string;
  nombre: string;
  descripcion: string;
  barrios: string[];
}

export const COMUNAS_QUIBDO: ComunaQuibdo[] = [
  {
    id: 'comuna_1',
    nombre: 'Comuna 1 (Centro / Ribera del Atrato)',
    descripcion: 'Corredor histórico comercial, Malecón y Catedral San Francisco de Asís',
    barrios: [
      'Centro',
      'Malecón del Atrato',
      'Barrio Roma',
      'Alameda Reyes',
      'Yesca Grande',
      'La Yesquita',
      'César Conto',
      'Cristo Rey'
    ]
  },
  {
    id: 'comuna_2',
    nombre: 'Comuna 2 (Norte / Huapango)',
    descripcion: 'Zona norte residencial y cuenca baja de la quebrada La Yesca',
    barrios: [
      'Huapango',
      'San Vicente',
      'Santa Ana',
      'El Porvenir',
      'Tomás Pérez',
      'Las Américas',
      'Pandeyuca',
      'Buenos Aires Norte'
    ]
  },
  {
    id: 'comuna_3',
    nombre: 'Comuna 3 (Occidente / Medrano)',
    descripcion: 'Zona occidental de alta densidad y accesos viales',
    barrios: [
      'Medrano',
      'Barrio Kennedy',
      'La Esmeralda',
      'Los Álamos',
      'Minuto de Dios',
      'Chambacú',
      'San Pedro'
    ]
  },
  {
    id: 'comuna_4',
    nombre: 'Comuna 4 (Sur / Playita)',
    descripcion: 'Zona sur ribereña y cuencas tributarias',
    barrios: [
      'El Niño Jesús',
      'Playita',
      'Alfonso López',
      'Las Margaritas',
      'San Judas Tadeo',
      'Mis Esfuerzos',
      'Subachoque'
    ]
  },
  {
    id: 'comuna_5',
    nombre: 'Comuna 5 (Suroriente / Jardín - Cabí)',
    descripcion: 'Zona de expansión urbana, cuenca del río Cabí y ciudadelas',
    barrios: [
      'El Jardín',
      'Cabí',
      'Reposo 1',
      'Reposo 2',
      'Obregón',
      'Buenos Aires Sur',
      'Ciudadela Mía'
    ]
  },
  {
    id: 'comuna_rural',
    nombre: 'Corregimientos / Zona Rural',
    descripcion: 'Asentamientos y cuencas rurales del municipio de Quibdó',
    barrios: [
      'Tutunendo',
      'Pacurita',
      'Tagachí',
      'San Francisco de Ichó',
      'Neguá',
      'Beté'
    ]
  }
];

export const BARRIOS_QUIBDO_TODOS = COMUNAS_QUIBDO.flatMap((c) => c.barrios).sort();
