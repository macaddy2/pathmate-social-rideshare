import { CURRENCY_SYMBOLS } from './constants';

export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  return `${CURRENCY_SYMBOLS[currency] || currency}${amount.toLocaleString()}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}
