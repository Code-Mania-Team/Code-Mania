-- Cosmetics ownership + preferences tables
-- Used by backend/models/userCosmetics.js and backend/models/userPreferences.js

create table if not exists public.user_cosmetics (
  id bigserial primary key,
  user_id uuid not null references public.users(user_id) on delete cascade,
  cosmetic_key text not null references public.cosmetics(key) on delete cascade,
  source text null,
  source_id bigint null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, cosmetic_key)
);

create index if not exists user_cosmetics_user_id_idx on public.user_cosmetics(user_id);
create index if not exists user_cosmetics_cosmetic_key_idx on public.user_cosmetics(cosmetic_key);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.users(user_id) on delete cascade,
  avatar_frame_key text null references public.cosmetics(key) on delete set null,
  terminal_skin_id text null references public.cosmetics(key) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists user_preferences_avatar_frame_key_idx on public.user_preferences(avatar_frame_key);
