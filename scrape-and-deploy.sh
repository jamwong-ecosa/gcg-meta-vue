#!/usr/bin/env bash
set -euo pipefail

source ~/.nvm/nvm.sh
nvm use 24.16.0

cd /home/jw/code/gcg-meta-vue

output=$(npm run scrape:bandai 2>&1) && status=0 || status=$?

fetched=$(echo "$output" | grep -oP 'Done\.\ \K[0-9]+(?= fetched)' || echo 0)

if [ "$fetched" -gt 0 ]; then
  netlify deploy --prod
  echo "$(date '+%Y-%m-%d %H:%M:%S') deployed with $fetched new events" >> cron.log
fi
