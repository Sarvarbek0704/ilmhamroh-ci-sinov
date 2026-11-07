#!/usr/bin/env bash
# zaxira.sh — 33-qism #09/#15: Postgres bazasining kunlik zaxirasi (pg_dump custom format), eski nusxalarni tozalash.
# Ishga tushirish: systemd timer (deploy/systemd/vazifalar-zaxira.timer) yoki cron. Ulanish — muhitdan (PGHOST, PGUSER, PGDATABASE; parol — ~/.pgpass yoki PGPASSFILE).
# 34-qism: nusxa serverdan TASHQARIGA (offsite) ko'chiriladi va tiklab ko'riladi — zaxira tiklanmaguncha zaxira emas.
set -euo pipefail
# zaxirada hamma foydalanuvchilar ma'lumoti bor — faqat egasi o'qiydi (sukut umask 002 da fayl -rw-rw-r-- edi, 33 #09)
umask 077
# find ishchi papkani tiklay olmasligi (su bilan /root dan) — "Failed to restore initial working directory"
cd /

ZAXIRA_PAPKA=${ZAXIRA_PAPKA:-/var/backups/vazifalar}
SAQLASH_KUN=${SAQLASH_KUN:-7}
BAZA=${PGDATABASE:-vazifalar}

log() { printf '%s zaxira: %s\n' "$(date -u +%FT%TZ)" "$*" >&2; }

# DIQQAT (33 #09 da topilgan xato): `[[ … ]] && rm` ko'rinishi shart yolg'on bo'lganda 1 qaytaradi — EXIT trap'ining oxirgi buyrug'i
# skript chiqish kodiga aylanadi: zaxira muvaffaqiyatli bo'lsa ham systemd "failed" dedi. if … fi — har doim 0
tozala_vaqtinchalik() {
  if [[ -n ${VAQTINCHA:-} && -f $VAQTINCHA ]]; then rm -f -- "$VAQTINCHA"; fi
}
trap tozala_vaqtinchalik EXIT

asosiy() {
  command -v pg_dump > /dev/null || { log "pg_dump topilmadi (PATH=$PATH)"; exit 127; }
  mkdir -p -- "$ZAXIRA_PAPKA"
  # bir vaqtda ikki nusxa ishlamasin (oldingisi hali tugamagan bo'lsa — chiqamiz)
  exec 9> "$ZAXIRA_PAPKA/.qulf"
  flock -n 9 || { log "boshqa zaxira ishlayapti — o'tkazildi"; exit 0; }

  local nom
  nom="$ZAXIRA_PAPKA/${BAZA}-$(date -u +%Y%m%dT%H%M%SZ).dump"
  VAQTINCHA="$nom.qism"
  local t0=$SECONDS
  pg_dump --format=custom --no-owner --file="$VAQTINCHA" "$BAZA"
  # yarim yozilgan fayl "tayyor" nom bilan qolmasin: avval .qism, keyin atomik rename
  mv -- "$VAQTINCHA" "$nom"
  VAQTINCHA=""
  # nusxa o'qiladimi (ro'yxat) — buzuq faylni "muvaffaqiyat" demaymiz
  pg_restore --list "$nom" > /dev/null
  log "tayyor: $nom ($(du -h -- "$nom" | cut -f1), $((SECONDS - t0)) s)"
  find "$ZAXIRA_PAPKA" -maxdepth 1 -name "${BAZA}-*.dump" -mtime +"$SAQLASH_KUN" -print -delete | sed 's/^/o'"'"'chirildi: /' >&2
}

asosiy "$@"
