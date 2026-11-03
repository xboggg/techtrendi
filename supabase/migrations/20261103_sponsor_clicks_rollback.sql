-- Rollback of 20261103_sponsor_clicks.sql (removes the tap counts too).
drop function if exists techtrendi.sponsor_stats();
drop function if exists techtrendi.track_sponsor_click(jsonb);
drop table if exists techtrendi.sponsor_clicks;
