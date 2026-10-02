export interface ComunaQuibdo {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'urbana' | 'rural';
  barrios: string[];
}

export const COMUNAS_QUIBDO: ComunaQuibdo[] = [
  {
    id: 'comuna_1',
    nombre: 'Comuna 1 (Centro Histórico & Ribera del Atrato)',
    descripcion: 'Eje institucional, comercial y turístico: Malecón, Alcaldía, Catedral y ribera del río Atrato',
    tipo: 'urbana',
    barrios: [
      'Centro',
      'Malecón del Atrato',
      'Barrio Roma',
      'Alameda Reyes',
      'Yesca Grande',
      'La Yesquita',
      'César Conto',
      'Cristo Rey',
      'San José',
      'El Silencio (Centro)',
      'Bahía Solano (El Pindo)'
    ]
  },
  {
    id: 'comuna_2',
    nombre: 'Comuna 2 (Norte & Huapango / San Vicente)',
    descripcion: 'Zona norte residencial, margen alta del río Atrato y cuenca baja de la quebrada La Yesca',
    tipo: 'urbana',
    barrios: [
      'Huapango',
      'San Vicente',
      'Santa Ana',
      'El Porvenir',
      'Tomás Pérez',
      'Las Américas',
      'Pandeyuca',
      'Buenos Aires Norte',
      'Samper',
      'El Silencio Norte',
      'Chamblum',
      'Los Álamos Norte'
    ]
  },
  {
    id: 'comuna_3',
    nombre: 'Comuna 3 (Occidente / Medrano & Kennedy)',
    descripcion: 'Zona occidental de alta densidad demográfica, vías colectoras y cuencas urbanas intermedias',
    tipo: 'urbana',
    barrios: [
      'Medrano',
      'Barrio Kennedy',
      'La Esmeralda',
      'Los Álamos',
      'Minuto de Dios',
      'Chambacú',
      'San Pedro',
      'La Gloria',
      'La Cascorva',
      'Simón Bolívar',
      'El Futuro',
      'Villa España',
      'Robledo'
    ]
  },
  {
    id: 'comuna_4',
    nombre: 'Comuna 4 (Sur / El Niño Jesús & Playita)',
    descripcion: 'Corredor sur ribereño, zonas de ladera y cuencas tributarias del río Atrato',
    tipo: 'urbana',
    barrios: [
      'El Niño Jesús',
      'Playita',
      'Alfonso López',
      'Las Margaritas',
      'San Judas Tadeo 1',
      'San Judas Tadeo 2',
      'Mis Esfuerzos',
      'Subachoque',
      'La Victoria',
      'Las Palmas',
      'Las Colinas',
      'Caraño Sur'
    ]
  },
  {
    id: 'comuna_5',
    nombre: 'Comuna 5 (Suroriente / El Jardín, Reposo & Cabí)',
    descripcion: 'Polo de expansión urbana, cuenca del río Cabí, ciudadelas habitacionales y vía al relleno sanitario',
    tipo: 'urbana',
    barrios: [
      'El Jardín',
      'Cabí (Sector Urbano)',
      'Reposo 1',
      'Reposo 2',
      'Reposo 3',
      'Obregón',
      'Buenos Aires Sur',
      'Ciudadela Mía',
      'El Diamante',
      'Paraíso',
      'La Aurora Sur',
      'Nuevo Horizonte',
      'Villa Hermosa'
    ]
  },
  {
    id: 'comuna_6',
    nombre: 'Comuna 6 (Oriental / El Caraño & Vía Medellín)',
    descripcion: 'Corredor aeroportuario, terminal de transporte, Universidad Tecnológica del Chocó (UTCH) y salida a Medellín',
    tipo: 'urbana',
    barrios: [
      'El Caraño',
      'Aeropuerto El Caraño',
      'Los Ángeles',
      'Sector Universidad UTCH',
      'Zona Franca / Vía Medellín',
      'Sector Base Aérea',
      'Los Castillos',
      'Las Brisas',
      'Villa del Río',
      'La Platina'
    ]
  },
  {
    id: 'comuna_rural',
    nombre: 'Corregimientos & Zona Rural de Quibdó',
    descripcion: 'Corregimientos turísticos, fluviales y cuencas hidrográficas del municipio de Quibdó',
    tipo: 'rural',
    barrios: [
      'Tutunendo (Caserío Principal)',
      'Tutunendo (Salto de la Borrascosa / Piedra Lisa)',
      'Pacurita (Balneario & Caserío)',
      'San Francisco de Ichó',
      'Cabí Rural (Relleno Sanitario Cabí)',
      'Tagachí (Río Atrato)',
      'Neguá',
      'Guayabal',
      'Beté / Villa Conto',
      'La Troje (Vía Tutunendo)',
      'Boca de Tanando',
      'San Antonio de los Managrús',
      'Bella Vista',
      'San Martín de Purré',
      'Barranco'
    ]
  }
];

export const BARRIOS_QUIBDO_TODOS = COMUNAS_QUIBDO.flatMap((c) => c.barrios).sort();
