const getLocale = () => (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(getLocale(), options).format(value);

export const formatPercent = (value: number, digits = 1) =>
  new Intl.NumberFormat(getLocale(), { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);

export const formatDateTime = (value: string | number | Date, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(getLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(value));

export const formatDurationSeconds = (ms: number) => formatNumber(ms / 1000, { maximumFractionDigits: 2 });
