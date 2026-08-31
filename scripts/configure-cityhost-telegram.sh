#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-/var/www/chbc6cc26c/www/resetclinic.org}"
CHAT_ID="-1004331746617"

cd "$PROJECT_DIR"
ENV_FILE=".env.production.local"
BACKUP_FILE="${ENV_FILE}.bak.$(date +%Y%m%d-%H%M%S)"
TMP_FILE="${ENV_FILE}.tmp.$$"

umask 077
touch "$ENV_FILE"
cp -p "$ENV_FILE" "$BACKUP_FILE"

printf "Telegram bot token: "
IFS= read -r -s BOT_TOKEN
printf "\n"

if [[ -z "$BOT_TOKEN" ]]; then
  echo "Token is empty. Nothing changed."
  exit 1
fi

# Preserve every other production variable and replace Telegram values only.
grep -vE '^(TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID|TELEGRAM_MESSAGE_THREAD_ID)=' "$ENV_FILE" > "$TMP_FILE" || true
printf '\nTELEGRAM_BOT_TOKEN=%s\nTELEGRAM_CHAT_ID=%s\n' "$BOT_TOKEN" "$CHAT_ID" >> "$TMP_FILE"
mv "$TMP_FILE" "$ENV_FILE"
chmod 600 "$ENV_FILE"
unset BOT_TOKEN

echo "Telegram lead notifications configured."
echo "Backup: $BACKUP_FILE"
echo "TELEGRAM_CHAT_ID=$CHAT_ID"
echo "TELEGRAM_BOT_TOKEN=***configured***"
