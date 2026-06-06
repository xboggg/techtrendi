#!/usr/bin/env bash
# techtrendi-deploy — SSH ForceCommand wrapper for the deploy key.
# Only allows: scp -t /tmp/techtrendi-new.tar.gz, or the install script.
# Anything else rejected and logged via syslog (journalctl -t techtrendi-deploy).
set -u
CMD="${SSH_ORIGINAL_COMMAND:-}"
case "$CMD" in
  "scp -t /tmp/techtrendi-new.tar.gz")
    exec scp -t /tmp/techtrendi-new.tar.gz
    ;;
  "/usr/local/bin/techtrendi-install")
    exec /usr/local/bin/techtrendi-install
    ;;
  "")
    logger -t techtrendi-deploy "rejected: empty command"
    echo "techtrendi-deploy: restricted to the deploy workflow only." >&2
    exit 1
    ;;
  *)
    logger -t techtrendi-deploy "rejected: $CMD"
    echo "techtrendi-deploy: forbidden command." >&2
    exit 1
    ;;
esac
