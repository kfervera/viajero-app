-- Esquema inicial: trips, activities, lodgings.
-- Sin autenticación: RLS queda habilitado con policies "allow all" para
-- el rol anon, en vez de deshabilitar RLS por completo (decisión intencional,
-- ver PLAN.md sección 7).

create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_image_url text,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  description text not null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lodgings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips (id) on delete cascade,
  name text not null,
  checkin_date date not null,
  checkout_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_trip_id_idx on activities (trip_id);
create index lodgings_trip_id_idx on lodgings (trip_id);

alter table trips enable row level security;
alter table activities enable row level security;
alter table lodgings enable row level security;

create policy "allow all for anon" on trips
  for all to anon using (true) with check (true);

create policy "allow all for anon" on activities
  for all to anon using (true) with check (true);

create policy "allow all for anon" on lodgings
  for all to anon using (true) with check (true);
