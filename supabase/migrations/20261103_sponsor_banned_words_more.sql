-- More words the sponsor guard refuses (3 Nov 2026, owner approved): hacking,
-- cracking, jailbreak, blacklist removal, IMEI change/repair, removing passwords /
-- passcodes / screen locks. Same AdSense reason as 20261102_sponsors.sql.
-- Allowed on purpose: "cracked screen", "check your IMEI", "blacklisted phones are
-- not unlocked", "network unlock".
-- Mirror: BANNED in src/data/sponsors.ts. Rollback: 20261103_sponsor_banned_words_more_rollback.sql

create or replace function techtrendi.sponsor_banned_words(_content jsonb)
returns text
language sql
immutable
set search_path to 'pg_temp'
as $$
  select (regexp_match(lower(_content::text), '(\mi[ -]?cloud|activation[ -]*lock|\mby[ -]?pass|\mfrp\M|\mmdm[ -]*remov|find[ -]*my[ -]*(iphone|device)[ -]*(off|remov)|\mhack|\mcrack(s|ing|er|ers)?\M|jail[ -]?break|black[ -]?list[a-z]*[ -]*(remov|clean|clear)|(remov|clean|clear)[a-z]*[ -]+(the[ -]+|your[ -]+)?black[ -]?list|\mimei[ -]*(chang|repair|edit|rewrit)|(chang|repair|edit|rewrit)[a-z]*[ -]+(the[ -]+|your[ -]+|an[ -]+)?imei|(remov|reset|bypass|unlock)[a-z]*[ -]+(the[ -]+|your[ -]+|a[ -]+)?(forgotten[ -]+)?(password|passcode|screen[ -]?lock|pattern[ -]?lock|pin[ -]?lock)|(password|passcode|screen[ -]?lock|pattern[ -]?lock)[ -]*remov)'))[1];
$$;
