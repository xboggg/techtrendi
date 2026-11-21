-- Scam alerts can show several screenshots as slides (21 Nov 2026).
-- image_url stays (first picture / older alerts); image_urls, when set, is the full ordered list.
alter table techtrendi.security_scam_alerts add column if not exists image_urls text[];
