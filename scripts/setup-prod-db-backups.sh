#!/usr/bin/env bash
# =============================================================================
# Set up nightly production database backups on the VPS (idempotent)
# =============================================================================
# Generates the backup script locally (KEEP_LAST baked in), installs it at
# /opt/quiz-backups/backup.sh on the VPS with a nightly 03:30 root cron,
# takes one backup immediately, and proves the backup by restoring it into a
# scratch database and counting rows (scratch dropped afterwards).
#
# Credentials are read from the quiz-api container env on the VPS at run
# time — nothing secret is stored here or on disk next to the dumps.
#
# Usage:
#   bash scripts/setup-prod-db-backups.sh [user@vps-host]
#     default host: root@207.180.199.86   (SSH key auth expected)
# =============================================================================
set -euo pipefail

SSH_TARGET="${1:-root@207.180.199.86}"
KEEP_LAST="${KEEP_LAST:-7}"

TMP=$(mktemp /tmp/quiz-backup-sh.XXXXXX)
trap 'rm -f "$TMP"' EXIT

# --- 1. Generate the backup script locally (KEEP_LAST baked in) ---
cat > "$TMP" <<EOF
#!/bin/bash
# Nightly quiz DB backup: discover container, dump gzipped, keep last $KEEP_LAST.
set -e
BACKUP_DIR=/opt/quiz-backups
KEEP_LAST=$KEEP_LAST
PG=\$(docker ps --format '{{.Names}}' | grep -E '^quiz-postgres' | head -1)
API=\$(docker ps --format '{{.Names}}' | grep -E '^quiz-api' | head -1)
[ -n "\$PG" ] && [ -n "\$API" ] || { echo "\$(date -Is) ERROR: quiz containers not found"; exit 1; }
API_ENV=\$(docker inspect "\$API" --format '{{range .Config.Env}}{{println .}}{{end}}')
DB_USER=\$(printf '%s\n' "\$API_ENV" | grep '^DB_USERNAME=' | cut -d= -f2-)
DB_NAME=\$(printf '%s\n' "\$API_ENV" | grep '^DB_DATABASE=' | cut -d= -f2-)
STAMP=\$(date +%Y%m%d_%H%M%S)
OUT="\$BACKUP_DIR/quiz_db_\$STAMP.sql.gz"
docker exec "\$PG" pg_dump -U "\$DB_USER" -d "\$DB_NAME" | gzip > "\$OUT"
SIZE=\$(stat -c%s "\$OUT")
[ "\$SIZE" -gt 1024 ] || { echo "\$(date -Is) ERROR: backup suspiciously small (\$SIZE bytes)"; exit 1; }
echo "\$(date -Is) OK: \$OUT (\$SIZE bytes)"
ls -1t "\$BACKUP_DIR"/quiz_db_*.sql.gz | tail -n +\$((KEEP_LAST + 1)) | xargs -r rm -f
EOF

echo "==> Installing backup script on $SSH_TARGET ..."
ssh "$SSH_TARGET" "mkdir -p /opt/quiz-backups"
scp -q "$TMP" "$SSH_TARGET:/opt/quiz-backups/backup.sh"

# --- 2. Install cron + hard-verify the installed script + run one backup ---
echo "==> Installing cron, verifying, running one backup ..."
ssh "$SSH_TARGET" bash -s <<'REMOTE'
set -e
chmod +x /opt/quiz-backups/backup.sh
# idempotent cron install (|| true guards the no-existing-crontab case)
crontab -l 2>/dev/null | grep -qF "/opt/quiz-backups/backup.sh" || \
  { (crontab -l 2>/dev/null || true; echo "30 3 * * * /opt/quiz-backups/backup.sh >> /opt/quiz-backups/backup.log 2>&1") | crontab -; }
echo "==> cron line:"; crontab -l | grep quiz-backups
# hard verification: the installed script must have a numeric retention
grep -Eq "^KEEP_LAST=[0-9]+$" /opt/quiz-backups/backup.sh || {
  echo "ERROR: installed backup.sh failed verification"; exit 1; }
echo "==> running one backup now..."
/opt/quiz-backups/backup.sh
REMOTE

# --- 3. Prove the backup restores into a scratch database ---
echo "==> Restore test ..."
ssh "$SSH_TARGET" bash -s <<'REMOTE'
set -e
PG=$(docker ps --format "{{.Names}}" | grep -E "^quiz-postgres" | head -1)
API=$(docker ps --format "{{.Names}}" | grep -E "^quiz-api" | head -1)
API_ENV=$(docker inspect "$API" --format "{{range .Config.Env}}{{println .}}{{end}}")
DB_USER=$(printf "%s\n" "$API_ENV" | grep "^DB_USERNAME=" | cut -d= -f2-)
LATEST=$(ls -1t /opt/quiz-backups/quiz_db_*.sql.gz | head -1)
echo "    restoring: $LATEST"
SCRATCH=quiz_backup_restore_test
docker exec "$PG" dropdb --if-exists -U "$DB_USER" "$SCRATCH"
docker exec "$PG" createdb -U "$DB_USER" "$SCRATCH"
gunzip -c "$LATEST" | docker exec -i "$PG" psql -U "$DB_USER" -d "$SCRATCH" -q -v ON_ERROR_STOP=1
docker exec "$PG" psql -U "$DB_USER" -d "$SCRATCH" -tAc \
  "select 'questions='||count(*) from questions union all select 'riddles='||count(*) from riddle_mcqs union all select 'jokes='||count(*) from dad_jokes union all select 'image_riddles='||count(*) from image_riddles"
docker exec "$PG" dropdb -U "$DB_USER" "$SCRATCH"
echo "==> restore test PASSED (scratch db dropped)"
REMOTE

echo
echo "Backups are live: nightly 03:30 VPS time, last $KEEP_LAST kept in /opt/quiz-backups/."
echo "Tip: copy the newest .sql.gz off the VPS now and then — a backup on the"
echo "same disk as the database is only half a backup."
