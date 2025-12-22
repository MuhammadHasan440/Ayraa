// @/components/ui/CurrencyFormatter.tsx
'use client';

interface CurrencyFormatterProps {
  value: number;
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// ✅ Export as named export
export function CurrencyFormatter({
  value,
  currency = 'PKR',
  locale = 'ur-PK',
  minimumFractionDigits = 0,
  maximumFractionDigits = 0,
}: CurrencyFormatterProps) {
  const formattedValue = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);

  return <span>{formattedValue}</span>;
}

// ✅ Also export a utility function for use outside JSX
export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}