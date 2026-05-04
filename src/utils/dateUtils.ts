import { getISOWeek, getISOWeekYear, startOfISOWeek, addWeeks, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Devuelve el número de semana ISO y año para una fecha dada
export function getWeekAndYear(date: Date): { weekNumber: number; year: number } {
  return {
    weekNumber: getISOWeek(date),
    year: getISOWeekYear(date),
  };
}

// Devuelve el Unix timestamp (segundos) del inicio del día en UTC
export function toDayTimestamp(date: Date): number {
  return Math.floor(startOfDay(date).getTime() / 1000);
}

// Devuelve la fecha del lunes de la semana ISO a partir del offset (-1 = semana pasada, 0 = esta semana, etc.)
export function getWeekStart(weekOffset: number): Date {
  return startOfISOWeek(addWeeks(new Date(), weekOffset));
}

// Formatea una fecha como "Semana 23 · Jun 2025"
export function formatWeekLabel(weekStart: Date): string {
  const weekNum = getISOWeek(weekStart);
  const monthYear = format(weekStart, 'MMM yyyy', { locale: es });
  return `Semana ${weekNum} · ${monthYear.charAt(0).toUpperCase()}${monthYear.slice(1)}`;
}

// Formatea una fecha como "Lun 5 Jun"
export function formatDayShort(date: Date): string {
  return format(date, 'EEE d MMM', { locale: es });
}

// Devuelve los 7 días de la semana ISO que contiene la fecha de inicio
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addWeeks(weekStart, 0) && new Date(weekStart.getTime() + i * 86400000));
}

// Convierte un Unix timestamp (segundos) a Date
export function fromTimestamp(ts: number): Date {
  return new Date(ts * 1000);
}

// Formatea duración en segundos como "1h 23m" o "45m"
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
