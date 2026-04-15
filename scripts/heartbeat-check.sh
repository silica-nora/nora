#!/usr/bin/env bash
set -euo pipefail

echo "CHECK_TS:$(date '+%Y-%m-%d %H:%M:%S %z')"

for f in /tmp/news-morning.log /tmp/news-afternoon.log /tmp/news-night.log; do
  if [ -s "$f" ]; then
    echo "HAS:$f"
  else
    echo "EMPTY:$f"
  fi
done

echo '---INJECTION/ERROR_SCAN---'
tail -n 120 /tmp/clawdbot/*.log 2>/dev/null \
  | grep -Ei 'error|fail|warn|ignore previous instructions|you are now|disregard your programming' \
  | tail -n 30 || true
