#!/usr/bin/env bash
# deploy-pm2.sh — 33-qism #27 (O-30): "yalang" VPS'ga qo'lda deploy (PM2). Serverda deploy foydalanuvchisi ishga tushiradi:
#   bash deploy-pm2.sh /tmp/vazifalar-api-<versiya>.tgz
# 33 #27 saboq: ${…:-…} ichidagi apostrof (yo'q) qo'shtirnoq ichida ham bash'ni buzdi — "unexpected EOF" (shellcheck SC1078/SC1011 ushladi).
# Tartib: yangi reliz papkasi → npm ci --omit=dev → migratsiya (alohida rol) → `joriy` symlink'ni atomik almashtirish → pm2 reload (nol uzilish)
#   → health tekshiruvi → yiqilsa ESKI relizga qaytish. Oxirgi 3 reliz saqlanadi.
set -euo pipefail

ARTEFAKT=${1:?artefakt .tgz fayli kerak}
ILDIZ=${ILDIZ:-/opt/vazifalar-api}
SAQLASH_SONI=${SAQLASH_SONI:-3}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:3000/health/ready}
MIGRATSIYA_ENV=${MIGRATSIYA_ENV:-/etc/vazifalar-api/migratsiya.env}

log() { printf '%s deploy: %s\n' "$(date -u +%T)" "$*"; }

RELIZ="$ILDIZ/relizlar/$(date -u +%Y%m%d%H%M%S)"
ESKI=$(readlink -f "$ILDIZ/joriy" 2> /dev/null || true)
mkdir -p "$RELIZ"
log "reliz: $RELIZ (eski: ${ESKI:-yoq})"
tar xzf "$ARTEFAKT" -C "$RELIZ"

cd "$RELIZ"
log "npm ci --omit=dev"
npm ci --omit=dev --no-audit --no-fund --loglevel=error

log "migratsiya (prisma migrate deploy)"
# migratsiya — alohida rol (DDL huquqi bilan); ilova roli (vazifalar_api) DDL qila olmaydi
# migratsiya yiqilsa — DAVOM ETMAYMIZ (`| grep … || true` xato kodini yutib yuborardi)
# shellcheck source=/dev/null
if ! MIG=$( set -a; . "$MIGRATSIYA_ENV"; set +a; node node_modules/prisma/build/index.js migrate deploy 2>&1 ); then
  printf '%s\n' "$MIG" | tail -5
  log "XATO: migratsiya yiqildi — joriy reliz o'zgarmadi"
  exit 1
fi
printf '%s\n' "$MIG" | grep -E "migrations? found|applied|No pending" || true

log "joriy → $RELIZ (atomik: ln -sfn + mv -T)"
ln -sfn "$RELIZ" "$ILDIZ/joriy.yangi"
mv -T "$ILDIZ/joriy.yangi" "$ILDIZ/joriy"

if pm2 describe vazifalar-api > /dev/null 2>&1; then
  log "pm2 reload (nusxalar birma-bir)"
  pm2 reload "$ILDIZ/joriy/deploy/ecosystem.config.cjs" --env production --update-env > /dev/null
else
  log "pm2 start (birinchi marta)"
  pm2 start "$ILDIZ/joriy/deploy/ecosystem.config.cjs" --env production > /dev/null
fi

log "health: $HEALTH_URL"
for _ in $(seq 1 30); do
  if curl -sf -o /dev/null "$HEALTH_URL"; then
    pm2 save > /dev/null
    log "TAYYOR"
    # eski relizlarni tozalash (oxirgi SAQLASH_SONI tasi qoladi)
    find "$ILDIZ/relizlar" -mindepth 1 -maxdepth 1 -type d | sort | head -n -"$SAQLASH_SONI" | xargs -r rm -rf --
    exit 0
  fi
  sleep 1
done

log "XATO: health 30 s da tayyor bo'lmadi — eski relizga qaytilmoqda"
if [[ -n $ESKI ]]; then
  ln -sfn "$ESKI" "$ILDIZ/joriy.yangi"
  mv -T "$ILDIZ/joriy.yangi" "$ILDIZ/joriy"
  pm2 reload "$ILDIZ/joriy/deploy/ecosystem.config.cjs" --env production --update-env > /dev/null
  log "qaytildi: $ESKI (DIQQAT: migratsiya orqaga qaytarilmaydi — expand/contract, 27-qism)"
fi
exit 1
