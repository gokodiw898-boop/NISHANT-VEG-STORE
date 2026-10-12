-- SAMPLE data only. Replace prices and add photos from the admin panel before launch.
insert into public.products (name, price, unit) values
  ('Potato', 30, 'kg'), ('Onion', 40, 'kg'), ('Tomato', 40, 'kg'), ('Cauliflower', 50, 'kg'),
  ('Cabbage', 30, 'kg'), ('Brinjal', 40, 'kg'), ('Okra (Bhindi)', 60, 'kg'),
  ('Bottle Gourd (Lauki)', 35, 'kg'), ('Green Chilli', 80, 'kg'), ('Spinach', 30, 'bunch')
on conflict do nothing;
