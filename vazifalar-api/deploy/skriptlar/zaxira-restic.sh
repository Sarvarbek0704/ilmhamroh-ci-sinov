#!/usr/bin/env bash
# deploy/skriptlar/zaxira-restic.sh — 34-qism #10–#11 (O-54, O-55): Postgres zaxirasi → restic (shifrlangan, deduplikatsiya) → S3; offsite nusxa → rclone.
#   33 #09 dagi zaxira.sh (lokal fayl, 7 kun) o'rnini bosadi: 3-2-1 — server diski (Docker volume) + S3 (asosiy) + boshqa provayder (offsite).
# Sozlama — /etc/vazifalar/zaxira.env (root, 600; git'da EMAS):
#   RESTIC_REPOSITORY=s3:https://<s3-manzil>/<bucket>/vazifalar   RESTIC_PASSWORD_FILE=/etc/vazifalar/restic-parol (kalitni YO'QOTMANG — zaxira o'qilmaydi)
#   AWS_ACCESS_KEY_ID=…  AWS_SECRET_ACCESS_KEY=…   OFFSITE=<rclone-remote>:<bucket> (ixtiyoriy)   RCLONE_CONFIG=/etc/vazifalar/rclone.conf
# Ishga tushirish: systemd timer (33 #09 vazifalar-zaxira.timer, ExecStart shu skript) yoki qo'lda. Tiklash mashqi — QADAMLAR 34 #11.
set -euo pipefail
umask 077
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY kerak}" "${RESTIC_PASSWORD_FILE:?RESTIC_PASSWORD_FILE kerak}"
RESTIC=${RESTIC:-restic}
RCLONE=${RCLONE:-rclone}
# dump buyrug'i: sukut — Compose ichidagi db (server); lokal sinovda boshqasi beriladi
read -r -a DUMP <<< "${PG_DUMP_CMD:-docker compose -p vazifalar exec -T db pg_dump -Fc -U postgres vazifalar}"

log() { printf '%s zaxira: %s\n' "$(date -u +%FT%TZ)" "$*"; }

# --stdin-from-command: pg_dump yiqilsa (exit != 0) restic snapshot SAQLAMAYDI. `pg_dump | restic --stdin` da yarim dump "muvaffaqiyatli" bo'lardi (pipefail'siz)
log "zaxira: ${DUMP[*]}"
"$RESTIC" backup --quiet --tag vazifalar --stdin-filename vazifalar.dump --stdin-from-command -- "${DUMP[@]}"
log "saqlash siyosati: 7 kunlik, 4 haftalik, 6 oylik"
"$RESTIC" forget --quiet --tag vazifalar --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
# butun repo emas — ma'lumotning 5 % ini har safar o'qib tekshirish (bitrot, buzilgan obyekt)
"$RESTIC" check --quiet --read-data-subset=5%
# DIQQAT (34 #11 1-urinish): ${VAR:?…} ichida apostrof bash'ni buzadi (33 #27 dagi tuzoq qaytdi) — xabarda apostrof yo'q
if [[ -n ${OFFSITE:-} ]]; then
  log "offsite: $OFFSITE"
  # repo allaqachon shifrlangan — offsite provayder mazmunni ko'rmaydi
  "$RCLONE" sync --quiet "${RCLONE_ASOSIY:?RCLONE_ASOSIY kerak - asosiy repo rclone manzili}" "$OFFSITE"
fi
log "tayyor: $("$RESTIC" snapshots --tag vazifalar --latest 1 --compact | grep -cE '^[0-9a-f]{8} ') ta oxirgi snapshot"
