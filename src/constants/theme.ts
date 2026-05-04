// FitTrack v2 — Sistema Visual Completo
// Modo oscuro (default) + modo claro · Tech-Futurista Contenido

export const DarkColors = {
  primary: '#00D4FF',
  secondary: '#7B61FF',
  accent: '#00FF87',
  warning: '#FFB800',
  danger: '#FF4757',
  background: '#0A0C10',
  surface: '#111520',
  surfaceElevated: '#161B28',
  surfaceHigh: '#1E2535',
  textPrimary: '#F0F4FF',
  textSecondary: '#8892A4',
  textHint: '#4A5568',
  border: 'rgba(0,212,255,0.15)',
  borderStrong: 'rgba(0,212,255,0.35)',
  overlay: 'rgba(0,0,0,0.7)',
} as const;

export const LightColors = {
  primary: '#5A44CC',
  secondary: '#00A8CC',
  accent: '#00A855',
  warning: '#CC7A00',
  danger: '#CC2B3A',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF1F7',
  surfaceHigh: '#E5E9F2',
  textPrimary: '#0D1117',
  textSecondary: '#5A6070',
  textHint: '#9AA0B0',
  border: 'rgba(90,68,204,0.15)',
  borderStrong: 'rgba(90,68,204,0.35)',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export type ColorScheme = { [K in keyof typeof DarkColors]: string };

// Gradientes (arrays para expo-linear-gradient)
export const Gradients = {
  primary: {
    dark: ['#00D4FF', '#7B61FF'] as [string, string],
    light: ['#5A44CC', '#00A8CC'] as [string, string],
  },
};

export const Typography = {
  fontFamily: {
    ios: 'System',
    android: 'Roboto',
  },
  fontSize: {
    h1: 28,
    h2: 22,
    h3: 18,
    bodyLg: 15,
    body: 13,
    caption: 11,
    button: 15,
    label: 12,
    timer: 48,
    metric: 28,
    // Legacy aliases para código existente
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    h1: 34,
    h2: 28,
    body: 22,
    caption: 16,
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    label: 0.06,
    metric: -0.5,
    button: 0.01,
  },
} as const;

// Spacing indexado: Spacing[1]=4, Spacing[2]=8, Spacing[3]=12...
export const Spacing = [0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64] as const;

export const Layout = {
  screenPaddingH: 16,
  cardRadius: 14,
  buttonRadius: 14,
  inputRadius: 10,
  pillRadius: 20,
  setRowRadius: 10,
  buttonHeight: 52,
  inputHeight: 48,
  tabBarHeight: 60,
  headerHeight: 56,
  dayDotSize: 36,
  statCardMinHeight: 72,
  exerciseCardHeight: 56,
  setRowHeight: 52,
  // Legacy aliases
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

export const Theme = { DarkColors, LightColors, Typography, Spacing, Layout };
export default Theme;
