#!/usr/bin/env bash
# plan/18 E2E pass 3 — outstanding items only:
#   replay once-guard (400 once the audit commit deploys; 201 before),
#   forged-token rejection on all three new modules,
#   guest-id absence in challenge/ttt views, ttt page cache.
set -u
API="https://api.pigzap.com/api/v1"
pass=0; fail=0
ok()   { pass=$((pass+1)); echo "PASS: $1"; }
bad()  { fail=$((fail+1)); echo "FAIL: $1"; }
lacks(){ case "$2" in *"$3"*) bad "$1 (LEAKED [$3])";; *) ok "$1";; esac; }
jqget() { python -c "import sys,json;d=json.load(sys.stdin);print(d$1)" 2>/dev/null; }

A=$(curl -s -X POST "$API/guest-users/token" -H 'Content-Type: application/json' -d '{}')
B=$(curl -s -X POST "$API/guest-users/token" -H 'Content-Type: application/json' -d '{}')
AG=$(echo "$A" | jqget "['guestId']"); AT=$(echo "$A" | jqget "['token']")
BG=$(echo "$B" | jqget "['guestId']"); BT=$(echo "$B" | jqget "['token']")
AH="X-Guest-Token: $AT"; BH="X-Guest-Token: $BT"

echo "--- forged tokens (expect 403) ---"
G1=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/duels" -H 'Content-Type: application/json' \
  -H "X-Guest-Token: forged-token" -d "{\"level\":\"easy\",\"questionCount\":5,\"playerName\":\"E\",\"guestId\":\"$AG\"}")
[ "$G1" = "403" ] && ok "duels forged token rejected" || bad "duels forged token (got $G1)"
G2=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/game-challenges" -H 'Content-Type: application/json' \
  -H "X-Guest-Token: forged-token" -d "{\"gameSlug\":\"x\",\"payload\":{},\"run\":{},\"playerName\":\"E\",\"guestId\":\"$AG\"}")
[ "$G2" = "403" ] && ok "game-challenges forged token rejected" || bad "challenges forged token (got $G2)"
G3=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/tictactoe" -H 'Content-Type: application/json' \
  -H "X-Guest-Token: forged-token" -d "{\"playerName\":\"E\",\"guestId\":\"$AG\",\"misere\":false}")
[ "$G3" = "403" ] && ok "tictactoe forged token rejected" || bad "ttt forged token (got $G3)"

echo "--- replay once-guard (deployed state check) ---"
C=$(curl -s -X POST "$API/duels" -H "$AH" -H 'Content-Type: application/json' \
  -d "{\"level\":\"easy\",\"questionCount\":5,\"playerName\":\"TesterA\",\"guestId\":\"$AG\"}")
CODE=$(echo "$C" | jqget "['code']")
JOIN=$(curl -s -X POST "$API/duels/$CODE/join" -H "$BH" -H 'Content-Type: application/json' \
  -d "{\"playerName\":\"TesterB\",\"guestId\":\"$BG\"}")
Q1=$(echo "$JOIN" | jqget "['questions'][0]['id']")
curl -s -X POST "$API/duels/$CODE/answer" -H "$AH" -H 'Content-Type: application/json' \
  -d "{\"guestId\":\"$AG\",\"questionId\":\"$Q1\",\"selected\":\"A\"}" >/dev/null
DUP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/duels/$CODE/answer" -H "$AH" -H 'Content-Type: application/json' \
  -d "{\"guestId\":\"$AG\",\"questionId\":\"$Q1\",\"selected\":\"B\"}")
[ "$DUP" = "400" ] && ok "replay rejected with 400 (once-guard LIVE)" || echo "NOTE: replay still $DUP — once-guard not deployed yet"

echo "--- view leaks ---"
GC=$(curl -s -X POST "$API/game-challenges" -H "$AH" -H 'Content-Type: application/json' \
  -d "{\"gameSlug\":\"word-puzzle\",\"payload\":{\"seed\":111111},\"run\":{\"score\":3},\"playerName\":\"TesterA\",\"guestId\":\"$AG\"}")
GT=$(echo "$GC" | jqget "['token']")
GV=$(curl -s "$API/game-challenges/$GT")
lacks "challenge view hides guest ids" "$GV" '"guestId"'
TC=$(curl -s -X POST "$API/tictactoe" -H "$AH" -H 'Content-Type: application/json' \
  -d "{\"playerName\":\"TesterA\",\"guestId\":\"$AG\",\"misere\":false}")
TCODE=$(echo "$TC" | jqget "['code']")
curl -s -X POST "$API/tictactoe/$TCODE/join" -H "$BH" -H 'Content-Type: application/json' \
  -d "{\"playerName\":\"TesterB\",\"guestId\":\"$BG\"}" >/dev/null
TV=$(curl -s "$API/tictactoe/$TCODE?guestId=$AG" -H "$AH")
lacks "ttt view hides guest ids" "$TV" '"guestId"'

echo "--- pages ---"
T2=$(curl -s "https://pigzap.com/games/tic-tac-toe/?cb=$RANDOM$RANDOM")
case "$T2" in *'data-mode="online"'*) ok "ttt page (fresh key) ships Online mode";; *) bad "ttt fresh page missing Online mode";; esac
T1=$(curl -s "https://pigzap.com/games/tic-tac-toe/")
case "$T1" in *'data-mode="online"'*) ok "ttt page (default URL) updated";; *) echo "NOTE: default URL still serving 4h-cached copy";; esac

echo "-----------------------------"
echo "PASS $pass / FAIL $fail"
