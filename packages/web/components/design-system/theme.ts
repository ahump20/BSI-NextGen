export const brandPalette = {
  ink: '#0B1B2B',
  accent: {
    blue: '#1D4ED8',
    orange: '#EA580C',
    green: '#16A34A',
    purple: '#7C3AED',
    slate: '#0F172A',
  },
  surface: {
    base: 'bg-white',
    muted: 'bg-slate-50',
  },
};

export const typography = {
  heading: 'font-semibold text-slate-900',
  body: 'text-slate-700',
  caption: 'text-xs text-slate-500',
};

export type AccentTone = keyof typeof brandPalette.accent;

export const gradients: Record<AccentTone, string> = {
  blue: 'from-blue-50 via-indigo-50 to-slate-50',
  orange: 'from-orange-50 via-amber-50 to-slate-50',
  green: 'from-emerald-50 via-green-50 to-slate-50',
  purple: 'from-violet-50 via-purple-50 to-slate-50',
  slate: 'from-slate-50 via-slate-100 to-white',
};
