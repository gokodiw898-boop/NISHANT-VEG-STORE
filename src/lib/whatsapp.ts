import type { OrderLine } from '../types';
import { formatINR } from './pricing';

export function buildMessage(lines: OrderLine[]): string {
  const total = lines.reduce((s, l) => s + l.totalPaise, 0);
  const body =
    lines.length === 1
      ? `Vegetable: ${lines[0].name}\nQuantity: ${lines[0].qtyLabel}\nPrice: ${formatINR(lines[0].totalPaise)}`
      : `${lines.map((l, i) => `${i + 1}. ${l.name} - ${l.qtyLabel} - ${formatINR(l.totalPaise)}`).join('\n')}\n\nTotal: ${formatINR(total)}`;
  return `Hello NISHANT VEG STORE! I want to order:\n\n${body}\n\nPlease confirm availability and delivery/pickup details.\n\nCustomer location: Khajuwala\n\nPlease confirm my order.`;
}

// number = country code 91 + 10 digits, digits only.
export const whatsappUrl = (lines: OrderLine[], number: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(buildMessage(lines))}`;

// Opens the chat with a prefilled message. The customer still has to press Send in WhatsApp.
export function openWhatsApp(lines: OrderLine[], number: string) {
  if (lines.length === 0) return;
  window.location.href = whatsappUrl(lines, number);
}
