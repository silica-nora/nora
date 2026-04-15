#!/usr/bin/env bash
set -euo pipefail
# Usage:
#   ./scripts/heartbeat-check-deep.sh          # default LOG_LINES=300
#   LOG_LINES=500 ./scripts/heartbeat-check-deep.sh
LOG_LINES="${LOG_LINES:-300}"
LOG_LINES="$LOG_LINES" "$(dirname "$0")/heartbeat-check.sh"
