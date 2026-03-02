#!/bin/bash
# News fetcher with Feishu notification
# Usage: ./send-news.sh <morning|afternoon|night>

TYPE=$1
FEISHU_ID="ou_096ff8ea55f4ef3d449ebda95879cdf0"
API_KEY="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"

cd ~/.openclaw/workspace/skills/news-fetcher

# Get news
NEWS=$(API_KEY=$API_KEY node scripts/news-fetcher.js $TYPE 2>&1)

# Extract just the news content (skip the first line which is just status)
BODY=$(echo "$NEWS" | tail -n +2)

# Send to Feishu using OpenClaw message tool
# We'll use a simple curl to the Feishu webhook or let the script output be sent

echo "$NEWS"
