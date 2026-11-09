// NUK RentServe Theme Tokens (Karnataka Crimson Red & Sun Gold)
// Premium White Glassmorphic Design System

export const COLORS = {
  // Brand colors
  brand: '#D71920',
  brandDeep: '#A80F17',
  brandTint: '#FDECEC',
  brandGlow: 'rgba(215, 25, 32, 0.12)',
  sun: '#FFC928',
  sunDeep: '#F0B800',
  sunTint: '#FFF6D6',
  sunGlow: 'rgba(255, 201, 40, 0.18)',

  // Surfaces & Neutrals (Premium White Glass Design)
  paper: '#F7F8FA',
  canvas: '#FFFFFF',
  white: '#FFFFFF',
  card: '#FFFFFF',
  ink: '#171717',
  inkLight: '#3C4043',
  mute: '#666666',
  muteLight: '#9B9B9B',
  line: '#EAEBED',
  lineDark: '#DCE0E5',

  // Glassmorphic Surfaces & Specular Borders
  glassSurface: 'rgba(255, 255, 255, 0.92)',
  glassSurfaceLighter: 'rgba(255, 255, 255, 0.97)',
  glassSurfaceTranslucent: 'rgba(255, 255, 255, 0.82)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
  glassBorderSubtle: 'rgba(234, 235, 237, 0.9)',
  specularWhite: 'rgba(255, 255, 255, 0.8)',

  // Semantic Status Tones
  ok: '#00D084',
  okTint: '#E6FAF2',
  liveMint: '#00D084',
  liveMintTint: '#E6FAF2',
  bad: '#DC2626',
  badDeep: '#991B1B',
  badTint: '#FEE2E2',
  info: '#1A56B0',
  infoTint: '#E7F0FD',
  warn: '#B45309',
  warnTint: '#FEF3C7',
  dark: '#171717',

  // Map & accents
  mapBg: '#F3F4F6',
  gpsBlue: '#2563EB',
  overlayDark: 'rgba(0, 0, 0, 0.45)',

  // Semantic and naming compatibility aliases
  crimson: '#D71920',
  crimsonTint: '#FDECEC',
  inkMuted: '#666666',
  emerald: '#00D084',
  emeraldTint: '#E6FAF2',
  sand: '#F7F8FA',
};

export const STATUS_TONES: Record<string, { bg: string; text: string }> = {
  Pending: { bg: COLORS.warnTint, text: COLORS.warn },
  Accepted: { bg: COLORS.infoTint, text: COLORS.info },
  'In Progress': { bg: COLORS.infoTint, text: COLORS.info },
  'in_progress': { bg: COLORS.infoTint, text: COLORS.info },
  Completed: { bg: COLORS.okTint, text: COLORS.ok },
  Cancelled: { bg: COLORS.badTint, text: COLORS.bad },
  Approved: { bg: COLORS.okTint, text: COLORS.ok },
  Rejected: { bg: COLORS.badTint, text: COLORS.bad },
  'Under review': { bg: COLORS.warnTint, text: COLORS.warn },
  'Needs changes': { bg: COLORS.badTint, text: COLORS.bad },
  Active: { bg: COLORS.okTint, text: COLORS.ok },
  Scheduled: { bg: COLORS.infoTint, text: COLORS.info },
  Confirmed: { bg: COLORS.infoTint, text: COLORS.info },
  Assigned: { bg: COLORS.infoTint, text: COLORS.info },
  Verified: { bg: COLORS.okTint, text: COLORS.ok },
  Draft: { bg: '#EAEBED', text: '#555555' },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  full: 9999,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  card: {
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  luxe: {
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },
  pop: {
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  brandGlow: {
    shadowColor: '#D71920',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
};
