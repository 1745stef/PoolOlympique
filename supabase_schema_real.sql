-- ============================================================
--  SCHÉMAS RÉELS — Base de données Supabase
-- ============================================================

-- TABLE: users
create table public.users (
  id uuid not null default gen_random_uuid (),
  username text not null,
  password_hash text not null,
  is_admin boolean not null default false,
  created_at timestamp with time zone null default now(),
  must_change_password boolean not null default false,
  temp_password_hash text null,
  favorite_country text null,
  avatar_url text null,
  avatar_color text null default '#000000'::text,
  avatar_text_color text null default '#FFFFFF'::text,
  avatar_original_url text null,
  avatar_type text null default 'letter'::text,
  avatar_url_external text null,
  language text null default 'fr-ca'::text,
  constraint users_pkey primary key (id),
  constraint users_username_key unique (username),
  constraint users_avatar_type_check check (avatar_type = any (array['upload'::text, 'url'::text, 'letter'::text])),
  constraint users_language_check check (language = any (array['fr-fr'::text,'fr-ca'::text,'en-us'::text,'en-gb'::text,'en-ca'::text]))
) TABLESPACE pg_default;

-- TABLE: group_members
create table public.group_members (
  group_id uuid not null,
  user_id uuid not null,
  joined_at timestamp with time zone null default now(),
  constraint group_members_pkey primary key (group_id, user_id),
  constraint group_members_group_id_fkey foreign key (group_id) references groups (id) on delete cascade,
  constraint group_members_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) TABLESPACE pg_default;

-- TABLE: groups
create table public.groups (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  constraint groups_pkey primary key (id),
  constraint groups_name_key unique (name),
  constraint groups_created_by_fkey foreign key (created_by) references users (id) on delete set null
) TABLESPACE pg_default;

-- TABLE: picks
create table public.picks (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  discipline_id text not null,
  country_id text not null,
  updated_at timestamp with time zone null default now(),
  constraint picks_pkey primary key (id),
  constraint picks_user_id_discipline_id_key unique (user_id, discipline_id),
  constraint picks_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) TABLESPACE pg_default;

-- TABLE: results
create table public.results (
  discipline_id text not null,
  gold_country_id text null,
  silver_country_id text null,
  bronze_country_id text null,
  recorded_at timestamp with time zone null default now(),
  constraint results_pkey primary key (discipline_id)
) TABLESPACE pg_default;


-- TABLE: settings
create table public.settings (
  key   text primary key,
  value text not null
);

-- Valeurs par défaut
insert into public.settings (key, value) values
  ('inactivity_enabled', 'true'),
  ('inactivity_timeout', '30'),
  ('inactivity_warning', '2')
on conflict (key) do nothing;

-- RLS
alter table public.settings enable row level security;
create policy "service role full access settings" on public.settings using (true) with check (true);
