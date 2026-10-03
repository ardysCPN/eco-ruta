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

// Coordenadas geográficas representativas de barrios y sectores de Quibdó
export const COORDENADAS_BARRIOS_QUIBDO: Record<string, { lat: number; lng: number }> = {
  'Centro': { lat: 5.6940, lng: -76.6580 },
  'Malecón del Atrato': { lat: 5.6955, lng: -76.6605 },
  'Barrio Roma': { lat: 5.6925, lng: -76.6565 },
  'Alameda Reyes': { lat: 5.6912, lng: -76.6578 },
  'Yesca Grande': { lat: 5.6901, lng: -76.6550 },
  'La Yesquita': { lat: 5.6918, lng: -76.6535 },
  'César Conto': { lat: 5.6885, lng: -76.6570 },
  'Cristo Rey': { lat: 5.6865, lng: -76.6582 },
  'San José': { lat: 5.6895, lng: -76.6600 },
  'El Silencio (Centro)': { lat: 5.6930, lng: -76.6540 },
  'Bahía Solano (El Pindo)': { lat: 5.6965, lng: -76.6590 },
  'Huapango': { lat: 5.7010, lng: -76.6540 },
  'San Vicente': { lat: 5.6980, lng: -76.6530 },
  'Santa Ana': { lat: 5.6995, lng: -76.6505 },
  'El Porvenir': { lat: 5.7030, lng: -76.6560 },
  'Tomás Pérez': { lat: 5.7045, lng: -76.6545 },
  'Las Américas': { lat: 5.7060, lng: -76.6520 },
  'Pandeyuca': { lat: 5.7015, lng: -76.6495 },
  'Buenos Aires Norte': { lat: 5.7050, lng: -76.6480 },
  'Samper': { lat: 5.7075, lng: -76.6500 },
  'El Silencio Norte': { lat: 5.6970, lng: -76.6515 },
  'Chamblum': { lat: 5.7000, lng: -76.6585 },
  'Los Álamos Norte': { lat: 5.7085, lng: -76.6465 },
  'Medrano': { lat: 5.6890, lng: -76.6660 },
  'Barrio Kennedy': { lat: 5.6850, lng: -76.6650 },
  'La Esmeralda': { lat: 5.6870, lng: -76.6625 },
  'Los Álamos': { lat: 5.6910, lng: -76.6640 },
  'Minuto de Dios': { lat: 5.6840, lng: -76.6675 },
  'Chambacú': { lat: 5.6930, lng: -76.6620 },
  'San Pedro': { lat: 5.6900, lng: -76.6610 },
  'La Gloria': { lat: 5.6820, lng: -76.6695 },
  'La Cascorva': { lat: 5.6810, lng: -76.6660 },
  'Simón Bolívar': { lat: 5.6835, lng: -76.6630 },
  'El Futuro': { lat: 5.6860, lng: -76.6710 },
  'Villa España': { lat: 5.6895, lng: -76.6685 },
  'Robledo': { lat: 5.6920, lng: -76.6670 },
  'El Niño Jesús': { lat: 5.6810, lng: -76.6570 },
  'Playita': { lat: 5.6840, lng: -76.6605 },
  'Alfonso López': { lat: 5.6795, lng: -76.6550 },
  'Las Margaritas': { lat: 5.6780, lng: -76.6535 },
  'San Judas Tadeo 1': { lat: 5.6765, lng: -76.6560 },
  'San Judas Tadeo 2': { lat: 5.6750, lng: -76.6575 },
  'Mis Esfuerzos': { lat: 5.6740, lng: -76.6540 },
  'Subachoque': { lat: 5.6770, lng: -76.6590 },
  'La Victoria': { lat: 5.6725, lng: -76.6555 },
  'Las Palmas': { lat: 5.6755, lng: -76.6520 },
  'Las Colinas': { lat: 5.6730, lng: -76.6505 },
  'Caraño Sur': { lat: 5.6790, lng: -76.6480 },
  'El Jardín': { lat: 5.6820, lng: -76.6450 },
  'Cabí (Sector Urbano)': { lat: 5.6750, lng: -76.6400 },
  'Reposo 1': { lat: 5.6840, lng: -76.6400 },
  'Reposo 2': { lat: 5.6825, lng: -76.6380 },
  'Reposo 3': { lat: 5.6810, lng: -76.6360 },
  'Obregón': { lat: 5.6860, lng: -76.6420 },
  'Buenos Aires Sur': { lat: 5.6775, lng: -76.6450 },
  'Ciudadela Mía': { lat: 5.6720, lng: -76.6370 },
  'El Diamante': { lat: 5.6740, lng: -76.6425 },
  'Paraíso': { lat: 5.6760, lng: -76.6440 },
  'La Aurora Sur': { lat: 5.6795, lng: -76.6470 },
  'Nuevo Horizonte': { lat: 5.6710, lng: -76.6390 },
  'Villa Hermosa': { lat: 5.6730, lng: -76.6460 },
  'El Caraño': { lat: 5.6920, lng: -76.6400 },
  'Aeropuerto El Caraño': { lat: 5.6910, lng: -76.6380 },
  'Los Ángeles': { lat: 5.6945, lng: -76.6420 },
  'Sector Universidad UTCH': { lat: 5.6970, lng: -76.6440 },
  'Zona Franca / Vía Medellín': { lat: 5.6900, lng: -76.6340 },
  'Sector Base Aérea': { lat: 5.6885, lng: -76.6360 },
  'Los Castillos': { lat: 5.6960, lng: -76.6390 },
  'Las Brisas': { lat: 5.6980, lng: -76.6410 },
  'Villa del Río': { lat: 5.6935, lng: -76.6370 },
  'La Platina': { lat: 5.7000, lng: -76.6380 },
  'Tutunendo (Caserío Principal)': { lat: 5.7520, lng: -76.5340 },
  'Tutunendo (Salto de la Borrascosa / Piedra Lisa)': { lat: 5.7580, lng: -76.5290 },
  'Pacurita (Balneario & Caserío)': { lat: 5.6780, lng: -76.6020 },
  'San Francisco de Ichó': { lat: 5.6420, lng: -76.5890 },
  'Cabí Rural (Relleno Sanitario Cabí)': { lat: 5.6580, lng: -76.6380 },
  'Tagachí (Río Atrato)': { lat: 5.8920, lng: -76.7120 },
  'Neguá': { lat: 5.7890, lng: -76.6120 },
  'Guayabal': { lat: 5.6210, lng: -76.6450 },
  'Beté / Villa Conto': { lat: 5.8450, lng: -76.6890 },
  'La Troje (Vía Tutunendo)': { lat: 5.7250, lng: -76.5920 },
  'Boca de Tanando': { lat: 5.6980, lng: -76.5680 },
  'San Antonio de los Managrús': { lat: 5.6310, lng: -76.6150 },
  'Bella Vista': { lat: 5.6130, lng: -76.6320 },
  'San Martín de Purré': { lat: 5.7410, lng: -76.5510 },
  'Barranco': { lat: 5.6300, lng: -76.6300 }
};

export interface DeteccionBarrioComuna {
  barrio: string;
  comunaId: string;
  comunaNombre: string;
  distanciaMetros: number;
}

// Obtener el barrio y la comuna más cercana a unas coordenadas en Quibdó
export const obtenerBarrioYComunaCercana = (lat: number, lng: number, maxDistanciaMetros = 1200): DeteccionBarrioComuna | null => {
  let closestBarrio: string | null = null;
  let minDistance = Infinity;

  for (const [barrio, coords] of Object.entries(COORDENADAS_BARRIOS_QUIBDO)) {
    const dLat = (coords.lat - lat) * 111000;
    const dLng = (coords.lng - lng) * 111000 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closestBarrio = barrio;
    }
  }

  if (minDistance <= maxDistanciaMetros && closestBarrio) {
    const comuna = COMUNAS_QUIBDO.find((c) => c.barrios.includes(closestBarrio!));
    return {
      barrio: closestBarrio,
      comunaId: comuna ? comuna.id : 'comuna_1',
      comunaNombre: comuna ? comuna.nombre : 'Comuna 1 (Centro)',
      distanciaMetros: Math.round(minDistance)
    };
  }

  return null;
};

// Detectar todas las comunas atravesadas por un conjunto de waypoints de una ruta
export const detectarComunasDeTrazado = (puntos: Array<[number, number]>): ComunaQuibdo[] => {
  const comunasMap = new Map<string, ComunaQuibdo>();

  puntos.forEach((p) => {
    const lat = p[0] > 0 ? p[0] : p[1];
    const lng = p[0] > 0 ? p[1] : p[0];
    const res = obtenerBarrioYComunaCercana(lat, lng, 1800);
    if (res) {
      const comuna = COMUNAS_QUIBDO.find((c) => c.id === res.comunaId);
      if (comuna && !comunasMap.has(comuna.id)) {
        comunasMap.set(comuna.id, comuna);
      }
    }
  });

  return Array.from(comunasMap.values());
};
