-- Rollback for 20261121_scam_alert_slug.sql. Removes the per-alert web address.
-- Pages at /scam-alerts/<slug> will stop resolving after the next build.
drop trigger if exists scam_alerts_fill_slug on techtrendi.security_scam_alerts;
drop function if exists techtrendi.scam_alerts_fill_slug();
drop function if exists techtrendi.scam_alert_slug_base(text);
drop index if exists techtrendi.security_scam_alerts_slug_key;
alter table techtrendi.security_scam_alerts drop column if exists slug;
