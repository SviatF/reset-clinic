#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.production.local"
USERNAME_DEFAULT="admin@reset.clinic"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${ENV_FILE}.bak.${TIMESTAMP}"

if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$BACKUP_FILE"
else
  touch "$ENV_FILE"
fi

printf "Admin username [%s]: " "$USERNAME_DEFAULT"
IFS= read -r ADMIN_USERNAME_INPUT
ADMIN_USERNAME_VALUE="${ADMIN_USERNAME_INPUT:-$USERNAME_DEFAULT}"

while true; do
  printf "Admin password: "
  IFS= read -r -s ADMIN_PASSWORD_VALUE
  printf "\nConfirm admin password: "
  IFS= read -r -s ADMIN_PASSWORD_CONFIRM
  printf "\n"
  if [ -z "$ADMIN_PASSWORD_VALUE" ]; then
    echo "Password cannot be empty."
    continue
  fi
  if [ "$ADMIN_PASSWORD_VALUE" != "$ADMIN_PASSWORD_CONFIRM" ]; then
    echo "Passwords do not match. Try again."
    continue
  fi
  break
done

if command -v openssl >/dev/null 2>&1; then
  ADMIN_SESSION_SECRET_VALUE="$(openssl rand -hex 32)"
else
  ADMIN_SESSION_SECRET_VALUE="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))")"
fi

ENV_FILE="$ENV_FILE" ADMIN_USERNAME_VALUE="$ADMIN_USERNAME_VALUE" ADMIN_PASSWORD_VALUE="$ADMIN_PASSWORD_VALUE" ADMIN_SESSION_SECRET_VALUE="$ADMIN_SESSION_SECRET_VALUE" node <<'NODE'
const fs = require('node:fs');
const path = process.env.ENV_FILE;
const updates = {
  ADMIN_USERNAME: process.env.ADMIN_USERNAME_VALUE,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD_VALUE,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET_VALUE,
};
let text = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';
for (const [key, value] of Object.entries(updates)) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) text = text.replace(re, line);
  else text += `${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`;
}
fs.writeFileSync(path, text, { mode: 0o600 });
NODE

chmod 600 "$ENV_FILE"
unset ADMIN_PASSWORD_VALUE ADMIN_PASSWORD_CONFIRM ADMIN_SESSION_SECRET_VALUE

echo "RESET Admin configured."
if [ -f "$BACKUP_FILE" ]; then
  echo "Backup: $BACKUP_FILE"
fi
echo "ADMIN_USERNAME=$ADMIN_USERNAME_VALUE"
echo "ADMIN_PASSWORD=***configured***"
echo "ADMIN_SESSION_SECRET=***generated***"
echo "Restart the Node.js application in CityHost after this step."
