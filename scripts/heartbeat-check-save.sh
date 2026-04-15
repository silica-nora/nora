#!/usr/bin/env bash
set -euo pipefail
MODE="${MODE:-light}"            # light | deep
LOG_LINES="${LOG_LINES:-120}"
TS="$(date '+%Y%m%d-%H%M%S')"
OUT="/tmp/heartbeat-check-${MODE}-${TS}.log"

if [ "$MODE" = "deep" ]; then
  LOG_LINES="$LOG_LINES" "$(dirname "$0")/heartbeat-check-deep.sh" > "$OUT"
else
  LOG_LINES="$LOG_LINES" "$(dirname "$0")/heartbeat-check.sh" > "$OUT"
fi

echo "$OUT"
