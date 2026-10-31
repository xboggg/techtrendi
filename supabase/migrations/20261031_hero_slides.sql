-- Homepage hero pictures, managed from /admin/hero-images (owner, 31 Oct 2026).
-- Before this the two pictures were hardcoded in src/pages/Index.tsx (HERO_IMAGES).
-- Same protection as techtrendi.ticker_items: visitors read the pictures that are
-- switched on, only admins write. Uploaded files live in /var/www/techtrendi/images/hero
-- (the deploy's rsync excludes /images, so they survive every deploy).

create table if not exists techtrendi.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,           -- computer copy (about 1920px wide)
  phone_image_url text,              -- phone copy (about 1280px wide); null = use image_url
  alt text not null default '',      -- short description for Google and screen readers
  focus_x smallint not null default 50 check (focus_x between 0 and 100),  -- where the face is, % from the left
  focus_y smallint not null default 50 check (focus_y between 0 and 100),  -- % from the top
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table techtrendi.hero_slides enable row level security;

drop policy if exists hero_slides_public_read on techtrendi.hero_slides;
create policy hero_slides_public_read on techtrendi.hero_slides
  for select using (is_active);

drop policy if exists hero_slides_admin_all on techtrendi.hero_slides;
create policy hero_slides_admin_all on techtrendi.hero_slides
  for all using (techtrendi.is_admin()) with check (techtrendi.is_admin());

grant select on techtrendi.hero_slides to anon;
grant select, insert, update, delete on techtrendi.hero_slides to authenticated;
grant all on techtrendi.hero_slides to service_role;

-- Start with the two pictures that were hardcoded (same order, same 75% crop).
insert into techtrendi.hero_slides (image_url, alt, focus_x, focus_y, sort_order)
select v.image_url, v.alt, 75, 50, v.sort_order
from (values
  ('/images/hero/hero-ghana-v2.jpg', 'Woman using her phone on a busy Accra street', 10),
  ('/images/hero/hero-ghana-dev2.jpg', 'Man working on a laptop in a tech co-working space', 20)
) as v(image_url, alt, sort_order)
where not exists (select 1 from techtrendi.hero_slides);

notify pgrst, 'reload schema';
