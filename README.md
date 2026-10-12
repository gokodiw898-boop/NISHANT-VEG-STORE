# NISHANT VEG STORE

Vegetable ordering site for Khajuwala town. Customers browse live products and send their order through WhatsApp. The owner manages everything from a phone-friendly admin panel.

**Stack:** React + TypeScript + Vite, Tailwind CSS, Supabase (Postgres, Auth, Storage, Realtime), hosted on Vercel.

## How it works
- Products live in the Supabase `products` table. The site loads them and listens for Realtime changes (plus refetch on reconnect, tab focus, and every 60 s), so edits show on every phone without redeploying.
- Order Now builds `https://wa.me/916350580036?text=...` with the vegetable, quantity and price. The customer must press Send in WhatsApp. Nothing is "auto-ordered".
- Prices use integer paise, so totals are exact. Quantities are chosen from fixed lists (never zero or negative).
- Admin login uses **Supabase Auth**. The password is verified by Supabase on the server and is **not in this code**. Only users listed in `admin_users` can write (Row Level Security + `is_admin()`); the admin table is unreadable through the API. Images upload to the `product-images` bucket (admin-only writes, public reads).
- Supabase Auth applies its own rate limits to login attempts. The login screen also adds a short lockout after 5 failures.

## Setup (about 15 minutes)
1. Create a free project at supabase.com.
2. SQL Editor: run `supabase/migrations/001_schema.sql`, then `002_seed_sample_products.sql` (sample prices, replace them later).
3. Authentication > Users > **Add user**: choose an email (it does not need to be real, for example `owner@nishantvegstore.in`), set a strong password, tick **Auto Confirm**.
4. Authentication > Sign In / Providers (or Settings): **turn off "Allow new users to sign up"** so nobody else can register.
5. SQL Editor: edit the email in `003_make_admin.sql` and run it. This grants admin rights to that user only.
6. Copy `.env.example` to `.env` and fill in the URL and anon key (Project Settings > API) and the admin email. Never use the service-role key here.
7. `npm install` then `npm run dev`.

## Deploy to Vercel
1. Push this folder to GitHub and import it in Vercel (framework: Vite).
2. Add the four `VITE_` variables from `.env.example` in Project Settings > Environment Variables.
3. Deploy. Open the site on your phone, log in via the tiny **Admin** link at the bottom, set real prices and photos.

## Changing the WhatsApp number
Set `VITE_WHATSAPP_NUMBER` (digits only, with country code, e.g. `916350580036`) and redeploy.

## Pre-launch checks (run these yourself on the live site)
Open on Android; products load from the database; images show; 250 g / 500 g / 1 kg prices are right; Order Now opens WhatsApp with the message; multi-item order works; out-of-stock cannot be ordered; wrong password is rejected; add / edit / delete / stock toggle work and show on a second phone; data survives refresh and logout; calling the REST API with only the anon key cannot insert, update or delete products.
