// NUK RentServe Theme Tokens (Karnataka Crimson Red & Sun Gold)

export const COLORS = {
  // Brand colors
  brand: '#D71920',
  brandDeep: '#A80F17',
  brandTint: '#FDECEC',
  sun: '#FFC928',
  sunDeep: '#F0B800',
  sunTint: '#FFF6D6',

  // Surfaces & Neutrals
  paper: '#F8F7F4',
  white: '#FFFFFF',
  card: '#FFFFFF',
  ink: '#202124',
  inkLight: '#3C4043',
  mute: '#686868',
  muteLight: '#9B9B9B',
  line: '#E7E7E7',
  lineDark: '#D6D6D6',

  // Semantic Status Tones
  ok: '#16834A',
  okTint: '#E5F4EC',
  bad: '#DC2626',
  badDeep: '#991B1B',
  badTint: '#FEE2E2',
  info: '#1A56B0',
  infoTint: '#E7F0FD',
  warn: '#B45309',
  warnTint: '#FEF3C7',
  dark: '#202124',

  // Map & accents
  mapBg: '#EEF0E8',
  gpsBlue: '#2563EB',
  overlayDark: 'rgba(0, 0, 0, 0.55)',

  // Semantic and naming compatibility aliases
  crimson: '#D71920',
  crimsonTint: '#FDECEC',
  inkMuted: '#686868',
  emerald: '#16834A',
  emeraldTint: '#E5F4EC',
  sand: '#F7F4EE',
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
  Draft: { bg: '#EFEFEF', text: '#555555' },
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#202124',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pop: {
    shadowColor: '#202124',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
};
