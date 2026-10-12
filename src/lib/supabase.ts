import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configured = Boolean(url && key && !url.startsWith('your_') && !key.startsWith('your_'));

// Only the public anon key is used here. Row Level Security in the database decides what it may do.
export const supabase = createClient(
  configured ? (url as string) : 'https://placeholder.supabase.co',
  configured ? (key as string) : 'placeholder',
  { auth: { persistSession: true, autoRefreshToken: true } },
);

export const BUCKET = 'product-images';
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '';

export function friendlyError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  if (e?.code === '23505') return 'A vegetable with this name already exists.';
  if (e?.code === '23514') return 'Some values are not allowed. Check name, price and unit.';
  const msg = e?.message ?? '';
  if (/failed to fetch|networkerror|load failed|network request/i.test(msg)) {
    return 'No internet connection. Your change was not saved. Please try again.';
  }
  return msg ? `Could not save: ${msg}` : 'Something went wrong. Your change was not saved.';
}
