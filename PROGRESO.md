# PROGRESO — FitTrack

## Estado actual: Sprint 3 completado ✅ · Siguiente: Auditoría nº 2

`npx tsc --noEmit` → sin errores.

---

## Arquitectura general

- **Framework:** React Native + Expo SDK 54, TypeScript 5.x
- **Base de datos:** SQLite local via `expo-sqlite` (offline-first, sin servidor)
- **Navegación:** React Navigation 6 (native-stack + bottom-tabs)
- **Estado global:** Zustand 4.x
- **Gráficas:** SVG nativo (WeightChart propio) + Victory Native (VolumeChart)
- **Monetización:** RevenueCat (`react-native-purchases` v8.x) — tres tiers: Free / Plus / Pro
- **Anuncios:** Google AdMob (`react-native-google-mobile-ads` v14.x) — solo tier Free
- **Backend opcional:** Firebase (auth + Firestore) — solo backup para Plus/Pro
- **Notificaciones:** `expo-notifications` — timer de descanso en ActiveWorkoutScreen

---

## Base del proyecto (Fases 0–7) ✅

Todas las fases de desarrollo inicial están completas:

### Infraestructura (Fase 0)
- Estructura de carpetas completa con path aliases `@/`
- TypeScript con tsconfig, ESLint + Prettier
- `src/database/schema.ts` — DDL completo (9 tablas)
- `src/database/database.ts` — singleton SQLite, `initDatabase()`
- `src/database/migrations.ts` — sistema de migraciones por versión
- `src/types/database.types.ts` — mapeo exacto de filas SQLite
- `src/types/domain.types.ts` — tipos de negocio (`ExerciseProgressPoint` incluye `estimatedOneRM`)
- `src/types/navigation.types.ts` — parámetros de navegación por pantalla
- `src/constants/theme.ts` — design tokens (Colors, Typography, Spacing, Layout)

### Onboarding y Perfil (Fase 1)
- `WelcomeScreen`, `ProfileSetupScreen`, `GoalSetupScreen` — flujo completo
- `ProfileRepository` + `profileStore` — CRUD perfil en SQLite
- `RootNavigator` — decide entre Onboarding y MainApp según existencia de perfil
- `MainTabNavigator` — 4 tabs: Workout, Body, Planning, Profile
- Componentes comunes: `Button`, `Input`, `NumberInput`, `Card`, `Modal`, `ConfirmModal`, `EmptyState`, `SectionHeader`, `LoadingSpinner`, `Badge`, `ProgressBar`

### Módulo de Entrenamientos (Fase 2)
- Repositorios: `RoutineRepository`, `ExerciseRepository`, `WorkoutSessionRepository`, `SetLogRepository`
- `workoutStore` — estado y acciones de entrenamientos
- Pantallas: `WorkoutHomeScreen`, `DayDetailScreen`, `ActiveWorkoutScreen`, `WorkoutSummaryScreen`, `RoutineManagerScreen`, `EditDayScreen`
- Componentes: `DayCard`, `ExerciseItem`, `SetRow`, `WeekSelector`
- Timer de sesión, registro de sets en tiempo real, resumen post-entrenamiento

### Módulo de Cuerpo (Fase 3)
- Repositorios: `BodyWeightRepository`, `BodyMeasurementRepository`
- `bodyStore` + `useBodyProgress` — cálculo de ritmo y proyecciones
- Pantallas: `BodyHomeScreen`, `LogWeightScreen`, `WeightHistoryScreen`, `MeasurementsScreen`, `WeightGoalScreen`
- Componentes: `WeightCard`, `WeightChart` (SVG nativo), `PaceIndicator`, `GoalProgressCard`, `MeasurementRow`

### Gráficas de Progreso (Fase 4)
- `progressCalculator.ts` — `calculateExerciseProgress`, `estimateOneRepMax` (Brzycki), `getMax1RMFromSets`, `calculateWeeklyData`
- `VolumeChart` — gráfica Victory Native con métricas: peso máximo, volumen, reps, 1RM estimado
- `ExerciseHistoryScreen` — evolución de un ejercicio con selector de métrica
- `WeekComparisonScreen` — tabla + gráfica comparativa entre semanas

### Planning Inteligente (Fase 5)
- `weeklyAnalyzer.ts` — métricas calculadas de las últimas 4 semanas
- `planningEngine.ts` — 10 reglas de recomendación (R01–R10)
- `WeeklyPlanRepository` + `planningStore`
- Pantallas: `PlanningHomeScreen`, `PlanningHistoryScreen`
- Componentes: `RecommendationCard`, `PlanningWeekCard`

### Perfil y Configuración (Fase 6)
- `ProfileHomeScreen` — datos personales, edición inline
- `SettingsScreen` — toggle de unidades, exportación de datos, backup Firebase
- `EditPreferencesScreen` — cambio de preferencias de entrenamiento
- Conversión de unidades métrico/imperial en `formatUtils.ts`

### Pulido y QA (Fase 7)
- `EmptyState` en todas las pantallas sin datos
- Feedback háptico (`expo-haptics`) en acciones relevantes
- Validaciones de formulario
- `LoadingSpinner` en operaciones de DB
- Funciona completamente offline

---

## Sprint 1 — Monetización y Arquitectura Freemium ✅

### Infraestructura de tiers
- `src/constants/tiers.ts` — `AppTier = 'free' | 'plus' | 'pro'`; `TIER_LIMITS` por tier
- `src/context/PremiumContext.tsx` — RevenueCat init, `determineTier()`, `refreshTier()`; keys de test configuradas
- `src/hooks/useTierLimits.ts` — acceso a `TIER_LIMITS[tier]`
- `src/hooks/usePaywall.ts` — `openPaywall(highlightTier?)` navega al PaywallScreen modal
- `src/hooks/useFirebaseSync.ts` — sync Firebase condicional (solo Plus/Pro, AppState listener)
- `src/components/common/PremiumGate.tsx` — bloqueo de features con overlay + CTA de upgrade; modo compact disponible
- `src/screens/paywall/PaywallScreen.tsx` — tabs Plus/Pro, listas de features, compra vía RevenueCat, restaurar compra

### Navegación refactorizada
- `RootNavigator.tsx` — login eliminado del flujo; app arranca sin cuenta; PaywallScreen como modal
- `App.tsx` — `AuthProvider` eliminado; `PremiumProvider` añadido; listener notificación timer
- `navigation.types.ts` — `AuthStackParamList` eliminado; `Paywall` añadido a `RootStackParamList`
- `WelcomeScreen.tsx` — copy "Gratis para empezar", feature Coach IA

### Límites por módulo
- `PlanningHomeScreen.tsx` — bloqueado Free (`PremiumGate requiredTier="plus"`)
- `MeasurementsScreen.tsx` — bloqueado Free (`PremiumGate requiredTier="plus"`)
- `WeightHistoryScreen.tsx` — historial 4 sem. en Free, banner CTA
- `ExerciseHistoryScreen.tsx` — 1 métrica en Free vs 4 en Plus
- `WeekComparisonScreen.tsx` — rango 4 sem. en Free; 8/12 muestran lock
- `RoutineManagerScreen.tsx` — 1 rutina en Free; intento de crear 2ª abre paywall
- `ProfileHomeScreen.tsx` — tier card visible con CTA de upgrade

### Firebase y seguridad
- `app.json` → `app.config.js` con `userInterfaceStyle: 'automatic'`
- `.env` + `.gitignore` — credenciales Firebase via `expo-constants`
- `credentialStorage.ts` eliminado — contraseña ya no se guarda en texto claro
- `authService.ts`, `AuthContext.tsx` — limpieza de referencias a credenciales
- `SettingsScreen.tsx` — `useFirebaseSync()` activado

---

## Sprint 2 — Mejoras de experiencia ✅

### IMP-02 — Timer de descanso automático al completar serie
- `SetRow.tsx` — props `restSeconds` (default 90) + `onComplete(restSeconds)` llamado solo al loguear serie nueva (no al actualizar ni eliminar)
- `ActiveWorkoutScreen.tsx` — `TimerPanel` convertido a `forwardRef<TimerPanelHandle>`; expone `startCountdown(seconds)`; `timerPanelRef` + `handleSetComplete` conectados; tab countdown se activa y arranca automáticamente al terminar serie

### IMP-03 — Peso de última sesión en DayDetailScreen + badges PR
- `SetLogRepository.ts` — tres nuevos métodos: `getLastSessionWeightsForDay`, `getAllTimeMaxWeightPerExercise`, `countPRsInSession` (devuelve `{ count, exerciseNames[] }`)
- `ExerciseItem.tsx` — props `lastWeight` ("Última: X kg") e `isPR` (badge ↑ PR verde, toma prioridad sobre `badge`)
- `DayDetailScreen.tsx` — carga pesos última sesión y máximos históricos en paralelo; pasa `lastWeight` e `isPR` a cada `ExerciseItem`

### IMP-05 — Reorganizar WorkoutHomeScreen con stats arriba
- `WorkoutHomeScreen.tsx` — fila de stats (completados / series / toneladas) movida encima del listado de días; tarjeta "Hoy" destacada con borde primario y etiqueta "HOY" cuando `weekOffset === 0`

### OPT-01 — PRs celebrados en WorkoutSummaryScreen
- `WorkoutSummaryScreen.tsx` — card `colors.accent` con icono medal; muestra count de PRs y, si hay > 1, los nombres de los ejercicios separados por " · "; trophy icon del hero también en accent

### OPT-03 — Línea de tendencia en WeightChart
- `WeightChart.tsx` — función `linearRegression` (mínimos cuadrados ordinarios); línea discontinua gris semitransparente cuando hay ≥ 3 puntos de datos

### FEAT-03 — 1RM estimado en ExerciseHistoryScreen
- `progressCalculator.ts` — `estimateOneRepMax` (fórmula Brzycki) y `getMax1RMFromSets`
- `domain.types.ts` — campo `estimatedOneRM` en `ExerciseProgressPoint`
- `VolumeChart.tsx` — tipo `VolumeMetric` extendido con `'estimatedOneRM'`
- `ExerciseHistoryScreen.tsx` — cuarta métrica "1RM estimado" en selector de toggle y panel de stats

---

## Sprint 3 — AdMob: anuncios intersticiales para Free ✅

### Instalación y configuración
- `react-native-google-mobile-ads@^14.0.0` instalado
- `app.config.js` — plugin AdMob con App IDs (TestIds en `__DEV__`, producción desde `.env`); variables `admobIosInterstitialId` / `admobAndroidInterstitialId` en `extra`
- `.env` — credenciales AdMob de producción añadidas (IDs reales de la cuenta)

### Infraestructura de anuncios
- `src/constants/admob.ts` — `ADMOB_INTERSTITIAL_ID` (TestIds en DEV, IDs reales en prod), `ADMOB_MIN_INTERVAL_MS = 3 min`
- `src/context/AdContext.tsx` — `AdProvider` con `InterstitialAd`, precarga automática, control de intervalo (3 min via ref), callback al cerrar; `showInterstitialIfEligible(onComplete?)` es no-op para Plus/Pro
- `App.tsx` — `AdProvider` añadido dentro de `PremiumProvider`

### Puntos de activación (solo tier Free)
- `ActiveWorkoutScreen.tsx` — `handleFinish`: guarda sesión en SQLite → muestra anuncio → navega a WorkoutSummary en el callback de cierre (datos seguros antes del anuncio)
- `PlanningHomeScreen.tsx` — `handleGenerate`: genera planning → muestra anuncio sin callback (bonus tras la acción, no bloquea)

### Argumentos de venta en el Paywall
- `PaywallScreen.tsx` — array `FREE_FEATURES` creado con limitaciones del tier gratuito incluyendo "Anuncios entre acciones" (destacado en amarillo); sección "Plan gratuito actual" reemplaza el texto estático; "Sin anuncios" en PLUS_FEATURES; "Sin anuncios, nunca" en PRO_FEATURES
- `PremiumGate.tsx` — subtitle Plus menciona eliminación de anuncios

### Reglas de negocio implementadas
- Nunca durante el entrenamiento activo (solo tras finalizar)
- Nunca en el Onboarding
- Nunca a usuarios Plus o Pro
- Máximo 1 anuncio cada 3 minutos (`lastAdShownAt` ref)
- El anuncio aparece siempre después de la acción, nunca antes

---

## Pendiente de configuración manual (fuera del código)

### RevenueCat
- [ ] Crear cuenta en revenuecat.com (gratuito)
- [ ] Configurar productos en Google Play Console: `fittrack_plus_lifetime`, `fittrack_pro_annual`
- [ ] Configurar entitlements en RevenueCat: `fittrack_plus`, `fittrack_pro`
- [ ] Reemplazar key de test `RC_API_KEY_ANDROID` en `PremiumContext.tsx` con clave real del dashboard
- [ ] (Opcional) Configurar en App Store Connect si se lanza en iOS

### AdMob
- [ ] `react-native-google-mobile-ads` requiere build nativo — no funciona en Expo Go
- [ ] Testear con `npx expo run:android` o EAS Build (`eas build --profile development`)
- [ ] Implementar UMP (User Messaging Platform) para consentimiento GDPR — pendiente Sprint 4

---

## Siguiente paso: Auditoría nº 2
