#!/usr/bin/env bash
set -euo pipefail
LOG_LINES="${LOG_LINES:-300}"
LOG_LINES="$LOG_LINES" "$(dirname "$0")/heartbeat-check.sh"
