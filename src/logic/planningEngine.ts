import type { ProfileRow, WeeklyPlanRow } from '@/types/database.types';
import type { RecommendationItem } from '@/types/domain.types';
import { analyzeWeeklyData } from '@/logic/weeklyAnalyzer';
import type { PlanningInput, WeeklyMetrics } from '@/logic/weeklyAnalyzer';

type Rule = (metrics: WeeklyMetrics, profile: ProfileRow) => RecommendationItem | null;

// R01: Baja adherencia sostenida (< 50% con 2+ sesiones perdidas)
const R01: Rule = (m) => {
  if (m.adherenceRate < 0.5 && m.missedSessionsCount >= 2) {
    return {
      id: '',
      category: 'recovery',
      priority: 'high',
      icon: 'calendar-remove',
      title: 'Revisa tu disponibilidad',
      description: `Has completado el ${Math.round(m.adherenceRate * 100)}% de tus sesiones previstas. Considera reducir un día por semana temporalmente para recuperar el ritmo.`,
      actionable: true,
    };
  }
  return null;
};

// R02: Riesgo de sobreentrenamiento (volumen +15% en una semana)
const R02: Rule = (m) => {
  if (m.hasOvertraining) {
    return {
      id: '',
      category: 'recovery',
      priority: 'high',
      icon: 'alert-circle',
      title: 'Semana de descarga recomendada',
      description: `Tu volumen aumentó un ${Math.round(m.volumeChangePercent)}% esta semana. Reduce la carga un 20% la próxima semana para favorecer la recuperación.`,
      actionable: true,
    };
  }
  return null;
};

// R03: Momento de progresar (buena adherencia, sin estancamiento ni sobreentrenamiento)
const R03: Rule = (m) => {
  if (m.adherenceRate >= 0.8 && !m.hasStagnation && !m.hasOvertraining && m.dataQuality !== 'insufficient') {
    return {
      id: '',
      category: 'training',
      priority: 'medium',
      icon: 'trending-up',
      title: 'Momento de progresar',
      description: 'Tu adherencia es excelente. Intenta aumentar el peso entre un 2.5 % y 5 % en tus ejercicios principales esta semana.',
      actionable: true,
    };
  }
  return null;
};

// R04: Estancamiento detectado (sin cambio de volumen 2+ semanas con buena adherencia)
const R04: Rule = (m) => {
  if (m.hasStagnation && m.adherenceRate >= 0.7) {
    return {
      id: '',
      category: 'training',
      priority: 'medium',
      icon: 'chart-flat',
      title: 'Estancamiento detectado',
      description: 'No has aumentado el volumen en 2 semanas. Prueba a cambiar el orden de ejercicios, añadir una serie extra o variar el rango de repeticiones.',
      actionable: true,
    };
  }
  return null;
};

// R05: Datos insuficientes (menos de 1 semana con datos)
const R05: Rule = (m) => {
  if (m.dataQuality === 'insufficient') {
    return {
      id: '',
      category: 'general',
      priority: 'medium',
      icon: 'information-outline',
      title: 'Establece tu línea base',
      description: 'Completa al menos 2 semanas de entrenamientos para recibir recomendaciones personalizadas basadas en tu progreso real.',
      actionable: false,
    };
  }
  return null;
};

// R06: Pérdida de peso acelerada (> 0.9 kg/semana con objetivo de perder peso)
const R06: Rule = (m, p) => {
  if (p.goal === 'lose_weight' && m.weeklyWeightChangeKg < -0.9) {
    return {
      id: '',
      category: 'weight',
      priority: 'high',
      icon: 'scale-unbalanced',
      title: 'Pérdida de peso acelerada',
      description: `Estás perdiendo ${Math.abs(m.weeklyWeightChangeKg).toFixed(1)} kg/semana, más de lo recomendable. Asegúrate de consumir suficiente proteína y considera aumentar ligeramente las calorías.`,
      actionable: true,
    };
  }
  return null;
};

// R07: Ritmo insuficiente para alcanzar el objetivo a tiempo
const R07: Rule = (m) => {
  if (
    m.weightGoal !== null &&
    !m.isOnTrackForGoal &&
    m.daysUntilGoal < 90 &&
    m.daysUntilGoal > 0 &&
    m.dataQuality !== 'insufficient' &&
    m.weightTrend !== 'no_data'
  ) {
    return {
      id: '',
      category: 'weight',
      priority: 'medium',
      icon: 'flag-outline',
      title: 'Revisa tu objetivo',
      description: `Tu ritmo actual (${m.weeklyWeightChangeKg >= 0 ? '+' : ''}${m.weeklyWeightChangeKg.toFixed(1)} kg/sem) no alcanzará tu objetivo a tiempo. Considera ajustar la fecha o la estrategia nutricional.`,
      actionable: true,
    };
  }
  return null;
};

// R08: Sin registros de peso recientes
const R08: Rule = (m) => {
  if (m.weightTrend === 'no_data') {
    return {
      id: '',
      category: 'weight',
      priority: 'low',
      icon: 'scale-bathroom',
      title: 'Registra tu peso',
      description: 'No has registrado tu peso esta semana. El seguimiento regular (1-2 veces por semana) mejora la calidad de las recomendaciones.',
      actionable: true,
    };
  }
  return null;
};

// R09: Objetivo casi alcanzado (dentro de 1 kg del objetivo)
const R09: Rule = (m) => {
  if (
    m.weightGoal !== null &&
    m.currentWeightKg !== null &&
    Math.abs(m.currentWeightKg - m.weightGoal.target_weight_kg) < 1.0
  ) {
    return {
      id: '',
      category: 'general',
      priority: 'high',
      icon: 'trophy',
      title: '¡Objetivo casi alcanzado!',
      description: 'Estás a menos de 1 kg de tu objetivo. Es momento de definir un nuevo objetivo de mantenimiento o actualizar tu meta.',
      actionable: true,
    };
  }
  return null;
};

// R10: Refuerzo positivo por constancia (≥90% adherencia durante 3+ semanas)
const R10: Rule = (m) => {
  if (m.adherenceRate >= 0.9 && m.consecutiveWeeksGoodAdherence >= 3) {
    return {
      id: '',
      category: 'general',
      priority: 'low',
      icon: 'star-circle',
      title: 'Constancia ejemplar',
      description: `Llevas ${m.consecutiveWeeksGoodAdherence} semanas con adherencia superior al 90 %. La constancia es el factor más importante del progreso a largo plazo.`,
      actionable: false,
    };
  }
  return null;
};

const RULES: Rule[] = [R01, R02, R03, R04, R05, R06, R07, R08, R09, R10];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function generateSummaryText(metrics: WeeklyMetrics, profile: ProfileRow): string {
  const adherencePct = Math.round(metrics.adherenceRate * 100);
  const parts: string[] = [`Adherencia: ${adherencePct}%.`];

  if (metrics.weightTrend !== 'no_data' && metrics.currentWeightKg !== null) {
    const trendLabel =
      metrics.weightTrend === 'losing'
        ? 'perdiendo'
        : metrics.weightTrend === 'gaining'
        ? 'ganando'
        : 'manteniendo';
    parts.push(
      `Peso actual: ${metrics.currentWeightKg.toFixed(1)} kg (${trendLabel} ${Math.abs(metrics.weeklyWeightChangeKg).toFixed(1)} kg/sem).`,
    );
  }

  if (metrics.averageVolumeLastWeek > 0) {
    parts.push(`Volumen semanal: ${metrics.averageVolumeLastWeek.toFixed(0)} kg.`);
  }

  parts.push(`Objetivo: ${profile.goal.replace('_', ' ')}.`);
  return parts.join(' ');
}

// Genera el planning de la semana a partir de los datos de las últimas 4 semanas
export function generateWeeklyPlan(input: PlanningInput): Omit<WeeklyPlanRow, 'id'> {
  const metrics = analyzeWeeklyData(input);

  const rawRecommendations = RULES.map(rule => rule(metrics, input.profile)).filter(
    (r): r is RecommendationItem => r !== null,
  );

  const recommendations = rawRecommendations
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 5)
    .map((r, i) => ({ ...r, id: `rec_${Date.now()}_${i}` }));

  const summary = generateSummaryText(metrics, input.profile);

  return {
    week_number: input.currentWeekNumber,
    year: input.currentYear,
    generated_at: Math.floor(Date.now() / 1000),
    summary: JSON.stringify(summary),
    recommendations: JSON.stringify(recommendations),
    data_snapshot: JSON.stringify({
      metricsSnapshot: {
        adherenceRate: metrics.adherenceRate,
        weightTrend: metrics.weightTrend,
        weeklyWeightChangeKg: metrics.weeklyWeightChangeKg,
        volumeChangePercent: metrics.volumeChangePercent,
        dataQuality: metrics.dataQuality,
      },
      profileGoal: input.profile.goal,
      weightGoalKg: input.weightGoal?.target_weight_kg ?? null,
    }),
  };
}
