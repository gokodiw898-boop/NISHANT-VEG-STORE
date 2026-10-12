-- Run AFTER creating the admin user in Authentication > Users. Replace the email.
insert into public.admin_users (user_id)
select id from auth.users where email = 'your_admin_email'
on conflict do nothing;
