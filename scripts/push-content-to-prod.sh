#!/usr/bin/env bash
# =============================================================================
# Push quiz + joke content from the local database to production (VPS)
# =============================================================================
# Dumps content-only tables (subjects, chapters, questions, joke_categories,
# dad_jokes, joke_votes) from the local Docker Postgres and restores them into
# the production quiz-postgres container.
#
# Safety properties:
#   - users / sessions / analytics / admin accounts are NEVER touched
#   - INSERT ... ON CONFLICT DO NOTHING => prod rows are never modified or
#     deleted, re-running is safe (only new rows arrive)
#   - UUID primary keys => no sequence fixing needed after restore
#   - prod Redis cache (quiz:* keys, TTL 300s) is flushed so counts update
#     immediately; joke votes in prod are preserved
#
# Usage:
#   ./scripts/push-content-to-prod.sh [user@vps-host]
#     default host: root@207.180.199.86
#
# Requirements:
#   - local ai-quiz-postgres container running (docker-compose.local.yml)
#   - SSH key access to the VPS with Docker permission for quiz-postgres
# =============================================================================
set -euo pipefail

SSH_TARGET="${1:-root@207.180.199.86}"
PROD_COMPOSE_DIR="${PROD_COMPOSE_DIR:-/etc/dokploy/compose/quiz-stack-gz5jv5/code}"
LOCAL_CONTAINER="${LOCAL_CONTAINER:-ai-quiz-postgres}"
LOCAL_DB_USER="${LOCAL_DB_USER:-aiquiz}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-aiquiz}"
PROD_CONTAINER="${PROD_CONTAINER:-quiz-postgres}"
PROD_REDIS_CONTAINER="${PROD_REDIS_CONTAINER:-quiz-redis}"
PROD_DB_USER="${PROD_DB_USER:-aiquiz}"
PROD_DB_NAME="${PROD_DB_NAME:-aiquiz}"

CONTENT_TABLES=(subjects chapters questions joke_categories dad_jokes joke_votes)

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

echo "==> Restoring into $PROD_CONTAINER, flushing quiz cache, cleaning up (one SSH session) ..."
ssh "$SSH_TARGET" "
  docker exec -i $PROD_CONTAINER psql -U $PROD_DB_USER -d $PROD_DB_NAME -v ON_ERROR_STOP=1 -q < /tmp/$DUMP_NAME &&
  cd $PROD_COMPOSE_DIR && set -a && . ./.env &&
  docker exec $PROD_REDIS_CONTAINER sh -c 'redis-cli -a \"\$REDIS_PASSWORD\" --no-auth-warning --scan --pattern \"quiz:*\" | xargs -r redis-cli -a \"\$REDIS_PASSWORD\" --no-auth-warning del' || true
  rm -f /tmp/$DUMP_NAME
"

echo
echo "==> Verifying production content via the public API ..."
echo "    question counts: $(curl -s --max-time 20 'https://api.pigzap.com/api/v1/quiz-mcq/question-counts' | head -c 300)"
echo "    joke categories: $(curl -s --max-time 20 'https://api.pigzap.com/api/v1/jokes/classic/categories' | head -c 300)"
echo
echo "Done. Quizzes and jokes pushed to production."
echo "Local dump kept at: $DUMP_FILE (safe to delete later)"
