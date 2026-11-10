-- Reverts 009: the channel post log and the poster's grants.

BEGIN;

REVOKE SELECT ON careers.public_jobs FROM careers_worker;
DROP TABLE careers.channel_posts;

COMMIT;
