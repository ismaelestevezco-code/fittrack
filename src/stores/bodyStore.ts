import { create } from 'zustand';
import { bodyWeightRepository } from '@/repositories/BodyWeightRepository';
import { bodyMeasurementRepository } from '@/repositories/BodyMeasurementRepository';
import { weightGoalRepository } from '@/repositories/WeightGoalRepository';
import type { BodyWeightRow, BodyMeasurementRow, WeightGoalRow } from '@/types/database.types';
import type { UpsertWeightInput } from '@/repositories/BodyWeightRepository';
import type { UpsertMeasurementInput } from '@/repositories/BodyMeasurementRepository';
import type { UpsertWeightGoalInput } from '@/repositories/WeightGoalRepository';

interface BodyState {
  // Registros de peso de los últimos 90 días (para gráfica del dashboard)
  recentWeights: BodyWeightRow[];
  // Historial completo de pesos (para WeightHistoryScreen)
  allWeights: BodyWeightRow[];
  // Objetivo de peso activo (null si no se ha configurado)
  weightGoal: WeightGoalRow | null;
  // Medidas corporales ordenadas por fecha descendente
  measurements: BodyMeasurementRow[];
  isLoading: boolean;

  // Carga los datos principales del módulo (pesos recientes + objetivo)
  loadBodyData: () => Promise<void>;
  // Carga el historial completo de pesos
  loadAllWeights: () => Promise<void>;
  // Carga el historial de medidas
  loadMeasurements: () => Promise<void>;
  // Guarda o actualiza un registro de peso del día
  logWeight: (input: UpsertWeightInput) => Promise<BodyWeightRow>;
  // Elimina un registro de peso
  deleteWeight: (id: number) => Promise<void>;
  // Guarda o reemplaza el objetivo de peso
  setWeightGoal: (input: UpsertWeightGoalInput) => Promise<void>;
  // Elimina el objetivo de peso
  clearWeightGoal: () => Promise<void>;
  // Guarda o actualiza las medidas de una fecha
  saveMeasurement: (input: UpsertMeasurementInput) => Promise<void>;
  // Elimina un registro de medidas
  deleteMeasurement: (id: number) => Promise<void>;
}

export const useBodyStore = create<BodyState>()((set, get) => ({
  recentWeights: [],
  allWeights: [],
  weightGoal: null,
  measurements: [],
  isLoading: false,

  loadBodyData: async () => {
    set({ isLoading: true });
    try {
      const [recentWeights, weightGoal] = await Promise.all([
        bodyWeightRepository.getRecent(90),
        weightGoalRepository.get(),
      ]);
      set({ recentWeights, weightGoal });
    } finally {
      set({ isLoading: false });
    }
  },

  loadAllWeights: async () => {
    const allWeights = await bodyWeightRepository.getAll();
    set({ allWeights });
  },

  loadMeasurements: async () => {
    const measurements = await bodyMeasurementRepository.getAll();
    set({ measurements });
  },

  logWeight: async (input) => {
    const row = await bodyWeightRepository.upsert(input);
    const recentWeights = await bodyWeightRepository.getRecent(90);
    set({ recentWeights });
    if (get().allWeights.length > 0) {
      const allWeights = await bodyWeightRepository.getAll();
      set({ allWeights });
    }
    return row;
  },

  deleteWeight: async (id) => {
    await bodyWeightRepository.delete(id);
    const [recentWeights, allWeights] = await Promise.all([
      bodyWeightRepository.getRecent(90),
      bodyWeightRepository.getAll(),
    ]);
    set({ recentWeights, allWeights });
  },

  setWeightGoal: async (input) => {
    const weightGoal = await weightGoalRepository.upsert(input);
    set({ weightGoal });
  },

  clearWeightGoal: async () => {
    await weightGoalRepository.delete();
    set({ weightGoal: null });
  },

  saveMeasurement: async (input) => {
    await bodyMeasurementRepository.upsert(input);
    const measurements = await bodyMeasurementRepository.getAll();
    set({ measurements });
  },

  deleteMeasurement: async (id) => {
    await bodyMeasurementRepository.delete(id);
    const measurements = await bodyMeasurementRepository.getAll();
    set({ measurements });
  },
}));
