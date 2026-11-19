-- PackArcade NEXT: ONLY aggregate metrics. No accounts, player identifiers,
-- IP addresses, cookies, user agents, search histories tied to people, or profiles.
-- Run once in the existing Supabase project's SQL editor before deployment.
create table if not exists public.arcade_game_totals (
  game_id text primary key check (char_length(game_id) between 1 and 75),
  views bigint not null default 0 check (views>=0)
);
create table if not exists public.arcade_daily_views (
  game_id text not null check (char_length(game_id) between 1 and 75),
  day date not null default current_date,
  views bigint not null default 0 check (views>=0),
  primary key(game_id,day)
);
create table if not exists public.arcade_search_totals (
  term text primary key check (char_length(term) between 2 and 64),
  searches bigint not null default 0 check (searches>=0)
);
alter table public.arcade_game_totals enable row level security;
alter table public.arcade_daily_views enable row level security;
alter table public.arcade_search_totals enable row level security;
revoke all on public.arcade_game_totals,public.arcade_daily_views,public.arcade_search_totals from anon,authenticated;
grant select,insert,update on public.arcade_game_totals,public.arcade_daily_views,public.arcade_search_totals to service_role;
create or replace function public.arcade_record_view(p_game_id text)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if p_game_id is null or p_game_id !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p_game_id)>75 then
    raise exception 'Invalid game ID';
  end if;
  insert into public.arcade_game_totals(game_id,views) values(p_game_id,1)
  on conflict(game_id) do update set views=arcade_game_totals.views+1;
  insert into public.arcade_daily_views(game_id,day,views) values(p_game_id,current_date,1)
  on conflict(game_id,day) do update set views=arcade_daily_views.views+1;
end $$;
create or replace function public.arcade_record_search(p_term text)
returns void language plpgsql security invoker set search_path = public as $$
declare cleaned text := lower(btrim(regexp_replace(coalesce(p_term,''),'\s+',' ','g')));
begin
  if char_length(cleaned) not between 2 and 64 then raise exception 'Invalid query'; end if;
  insert into public.arcade_search_totals(term,searches) values(cleaned,1)
  on conflict(term) do update set searches=arcade_search_totals.searches+1;
end $$;
revoke all on function public.arcade_record_view(text),public.arcade_record_search(text) from public,anon,authenticated;
grant execute on function public.arcade_record_view(text),public.arcade_record_search(text) to service_role;
