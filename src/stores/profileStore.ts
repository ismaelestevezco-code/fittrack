import { create } from 'zustand';
import { profileRepository } from '@/repositories/ProfileRepository';
import type { ProfileRow } from '@/types/database.types';
import type {
  CreateProfileInput,
  UpdateProfileInput,
} from '@/repositories/ProfileRepository';

interface ProfileState {
  // El perfil persistido en DB; null = onboarding no completado
  profile: ProfileRow | null;
  // true mientras se consulta la DB al arrancar la app
  isLoading: boolean;
  // Datos parciales acumulados durante el onboarding (Paso 1 → Paso 2)
  pendingSetup: Partial<CreateProfileInput>;

  loadProfile: () => Promise<void>;
  setPendingSetup: (data: Partial<CreateProfileInput>) => void;
  createProfile: (input: CreateProfileInput) => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  isLoading: true,
  pendingSetup: {},

  // Carga el perfil desde SQLite al arrancar; actualiza isLoading al terminar
  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await profileRepository.getFirst();
      set({ profile, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Almacena datos del Paso 1 del onboarding para usarlos en el Paso 2
  setPendingSetup: (data) => {
    set(state => ({ pendingSetup: { ...state.pendingSetup, ...data } }));
  },

  // Persiste el perfil completo al finalizar el onboarding
  createProfile: async (input) => {
    const profile = await profileRepository.create(input);
    set({ profile, pendingSetup: {} });
  },

  // Actualiza campos del perfil desde la pantalla de Perfil
  updateProfile: async (input) => {
    const { profile } = get();
    if (!profile) return;
    const updated = await profileRepository.update(profile.id, input);
    set({ profile: updated });
  },
}));
