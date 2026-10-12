import type { OrderLine, Product, Unit } from '../types';

export const UNITS: { value: Unit; label: string }[] = [
  { value: 'kg', label: 'per kg' },
  { value: '500g', label: 'per 500 g' },
  { value: '250g', label: 'per 250 g' },
  { value: 'piece', label: 'per piece' },
  { value: 'bunch', label: 'per bunch' },
];

const PACK_GRAMS: Record<string, number> = { kg: 1000, '500g': 500, '250g': 250 };
const isCount = (u: Unit) => u === 'piece' || u === 'bunch';

export interface QtyOption { value: number; label: string }

export const formatGrams = (g: number) => (g >= 1000 ? `${g / 1000} kg` : `${g} g`);

export function qtyLabel(unit: Unit, qty: number): string {
  if (unit === 'piece') return `${qty} ${qty === 1 ? 'piece' : 'pieces'}`;
  if (unit === 'bunch') return `${qty} ${qty === 1 ? 'bunch' : 'bunches'}`;
  return formatGrams(qty);
}

/** Selectable quantities. Weight units are in grams, count units are whole numbers. Always > 0. */
export function qtyOptions(unit: Unit): QtyOption[] {
  if (isCount(unit)) {
    return Array.from({ length: 10 }, (_, i) => i + 1).map((n) => ({ value: n, label: qtyLabel(unit, n) }));
  }
  const pack = PACK_GRAMS[unit];
  return [250, 500, 750, 1000, 1500, 2000, 3000, 5000]
    .filter((g) => g % pack === 0)
    .map((g) => ({ value: g, label: formatGrams(g) }));
}

export const defaultQty = (unit: Unit) => (isCount(unit) ? 1 : PACK_GRAMS[unit]);

/** Integer paise maths, so there are no floating point surprises. */
export function lineTotalPaise(price: number, unit: Unit, qty: number): number {
  if (!(qty > 0) || !(price >= 0)) return 0;
  const paise = Math.round(price * 100);
  return isCount(unit) ? paise * qty : Math.round((paise * qty) / PACK_GRAMS[unit]);
}

export function formatINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: paise % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export const unitSuffix = (u: Unit) =>
  ({ kg: '/kg', '500g': '/500 g', '250g': '/250 g', piece: '/piece', bunch: '/bunch' })[u];

export const toLine = (p: Product, qty: number): OrderLine => ({
  id: p.id,
  name: p.name,
  qtyLabel: qtyLabel(p.unit, qty),
  totalPaise: lineTotalPaise(p.price, p.unit, qty),
});
