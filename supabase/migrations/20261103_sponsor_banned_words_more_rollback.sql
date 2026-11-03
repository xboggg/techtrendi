-- Rollback of 20261103_sponsor_banned_words_more.sql: back to the 2 Nov word list.
create or replace function techtrendi.sponsor_banned_words(_content jsonb)
returns text
language sql
immutable
set search_path to 'pg_temp'
as $$
  select (regexp_match(lower(_content::text), '(\mi[ -]?cloud|activation[ -]*lock|\mby[ -]?pass|\mfrp\M|\mmdm[ -]*remov|find[ -]*my[ -]*(iphone|device)[ -]*(off|remov))'))[1];
$$;
