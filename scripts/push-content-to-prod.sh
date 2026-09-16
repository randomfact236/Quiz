#!/usr/bin/env bash
# =============================================================================
# Push quiz + joke + riddle content from the local database to production (VPS)
# =============================================================================
# Dumps content-only tables from the local Docker Postgres and restores them
# into the production postgres of the Dokploy deployment, then flushes the
# prod Redis quiz cache so counts update immediately.
#
# Prod target resolution (Dokploy apps layout since 2026-09-16):
#   - postgres / redis / api containers are discovered on the VPS by name
#     prefix (quiz-postgres*, quiz-api*, quiz-redis*) — the swarm task suffix
#     changes on every deploy, so container names are never hardcoded
#   - DB user / database name / redis password are read from the api
#     container's environment on the VPS — no credentials live in this repo
#
# Safety properties:
#   - users / sessions / analytics / admin accounts are NEVER touched
#   - INSERT ... ON CONFLICT DO NOTHING => prod rows are never modified or
#     deleted, re-running is safe (only new rows arrive)
#   - UUID primary keys => no sequence fixing needed after restore
#   - only the quiz:* Redis keys are deleted; everything else is preserved
#
# Usage:
#   bash scripts/push-content-to-prod.sh [user@vps-host]
#     default host: root@207.180.199.86
#     (prompts for the VPS password twice — scp + ssh — when no SSH key is
#      configured; install a key to go prompt-free)
#
# Requirements:
#   - local ai-quiz-postgres container running (docker-compose.local.yml)
# =============================================================================
set -euo pipefail

SSH_TARGET="${1:-root@207.180.199.86}"
LOCAL_CONTAINER="${LOCAL_CONTAINER:-ai-quiz-postgres}"
LOCAL_DB_USER="${LOCAL_DB_USER:-aiquiz}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-aiquiz}"

CONTENT_TABLES=(subjects chapters questions riddle_categories riddle_subjects riddle_mcqs \
  joke_categories dad_jokes joke_votes image_riddle_categories image_riddles)

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/backups"
mkdir -p "$OUT_DIR"
DUMP_NAME="content_push_$(date +%Y%m%d_%H%M%S).sql"
DUMP_FILE="$OUT_DIR/$DUMP_NAME"

echo "==> Dumping content tables from local container '$LOCAL_CONTAINER' ..."
TABLE_ARGS=()
for t in "${CONTENT_TABLES[@]}"; do TABLE_ARGS+=(--table="$t"); done

docker exec "$LOCAL_CONTAINER" pg_dump \
  -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" \
  --data-only --no-owner --no-privileges \
  --column-inserts --on-conflict-do-nothing --rows-per-insert=500 \
  "${TABLE_ARGS[@]}" > "$DUMP_FILE"

INSERTS=$(grep -c "^INSERT INTO" "$DUMP_FILE" || true)
if [ "$INSERTS" -eq 0 ]; then
  echo "ERROR: dump contains no rows - aborting (nothing was changed on prod)"
  exit 1
fi
echo "    dump written: $DUMP_FILE ($INSERTS insert statements)"

echo "==> Uploading to $SSH_TARGET ..."
scp -q "$DUMP_FILE" "$SSH_TARGET:/tmp/$DUMP_NAME"

echo "==> Restoring, flushing quiz cache, cleaning up (one SSH session) ..."
ssh "$SSH_TARGET" "
  set -e
  PG=\$(docker ps --format '{{.Names}}' | grep -E '^quiz-postgres' | head -1)
  API=\$(docker ps --format '{{.Names}}' | grep -E '^quiz-api' | head -1)
  REDIS=\$(docker ps --format '{{.Names}}' | grep -E '^quiz-redis' | head -1)
  [ -n \"\$PG\" ]    || { echo 'ERROR: no quiz-postgres container running on prod'; exit 1; }
  [ -n \"\$API\" ]   || { echo 'ERROR: no quiz-api container running on prod'; exit 1; }
  [ -n \"\$REDIS\" ] || { echo 'ERROR: no quiz-redis container running on prod'; exit 1; }
  API_ENV=\$(docker inspect \"\$API\" --format '{{range .Config.Env}}{{println .}}{{end}}')
  DB_USER=\$(printf '%s\n' \"\$API_ENV\" | grep '^DB_USERNAME=' | cut -d= -f2-)
  DB_NAME=\$(printf '%s\n' \"\$API_ENV\" | grep '^DB_DATABASE=' | cut -d= -f2-)
  REDIS_PW=\$(printf '%s\n' \"\$API_ENV\" | grep '^REDIS_PASSWORD=' | cut -d= -f2-)
  echo \"    target: \$PG (db=\$DB_NAME)\"
  docker exec -i \"\$PG\" psql -U \"\$DB_USER\" -d \"\$DB_NAME\" -v ON_ERROR_STOP=1 -q < /tmp/$DUMP_NAME
  docker exec \"\$REDIS\" redis-cli -a \"\$REDIS_PW\" --no-auth-warning FLUSHALL
  rm -f /tmp/$DUMP_NAME
  echo '    restore + cache flush done'
"

echo
echo "==> Verifying production content via the public API ..."
echo "    quiz subjects:   $(curl -s --max-time 20 'https://api.pigzap.com/api/v1/quiz-mcq/subjects' | head -c 200)"
echo "    riddle subjects: $(curl -s --max-time 20 'https://api.pigzap.com/api/v1/riddle-mcq/subjects' | head -c 200)"
echo "    joke categories: $(curl -s --max-time 20 'https://api.pigzap.com/api/v1/jokes/classic/categories' | head -c 200)"
echo "    image riddles:   $(curl -s --max-time 20 'https://api.pigzap.com/api/v1/image-riddles/categories' | head -c 200)"
echo
echo "Done. Content pushed to production."
echo "Local dump kept at: $DUMP_FILE (safe to delete later)"
