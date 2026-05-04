// Conversión de unidades

export function kgToLb(kg: number): number {
  return kg * 2.20462;
}

export function lbToKg(lb: number): number {
  return lb / 2.20462;
}

export function cmToIn(cm: number): number {
  return cm / 2.54;
}

export function inToCm(inches: number): number {
  return inches * 2.54;
}

// Formatea un número con hasta 2 decimales eliminando los ceros finales
// Ejemplos: 78.45 → "78.45", 99.30 → "99.3", 78.00 → "78"
export function formatDecimal(value: number, maxDecimals = 2): string {
  return parseFloat(value.toFixed(maxDecimals)).toString();
}

// Formatea un peso con la unidad correcta según el sistema seleccionado
export function formatWeight(kg: number, units: 'metric' | 'imperial', decimals = 1): string {
  if (units === 'imperial') {
    return `${kgToLb(kg).toFixed(decimals)} lb`;
  }
  return `${kg.toFixed(decimals)} kg`;
}

// Formatea una estatura con la unidad correcta
export function formatHeight(cm: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') {
    const totalIn = cmToIn(cm);
    const ft = Math.floor(totalIn / 12);
    const inch = Math.round(totalIn % 12);
    return `${ft}' ${inch}"`;
  }
  return `${Math.round(cm)} cm`;
}

// Etiquetas legibles para los valores enum del perfil

export const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Perder peso',
  gain_muscle: 'Ganar músculo',
  maintenance: 'Mantenimiento',
  sport_performance: 'Rendimiento deportivo',
  body_recomp: 'Recomposición corporal',
};

export const SEX_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  full_gym: 'Gimnasio completo',
  home_gym: 'Gimnasio en casa',
  no_equipment: 'Sin equipamiento',
};

// Formatea un número de segundos como "1min 30s" o "90s"
export function formatRestSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}
