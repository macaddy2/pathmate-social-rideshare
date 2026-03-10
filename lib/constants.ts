export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];

export const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', provider: 'Paystack' },
  { code: 'USD', symbol: '$', name: 'US Dollar', provider: 'Stripe' },
  { code: 'EUR', symbol: '€', name: 'Euro', provider: 'Stripe' },
  { code: 'GBP', symbol: '£', name: 'British Pound', provider: 'Stripe' },
] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
};
