#!/usr/bin/env bash
# deploy-pm2.sh — 33-qism #27 (O-30): "yalang" VPS'ga qo'lda deploy (PM2). Serverda deploy foydalanuvchisi ishga tushiradi:
#   bash deploy-pm2.sh /tmp/vazifalar-api-<versiya>.tgz
# 33 #27 saboq: ${…:-…} ichidagi apostrof (yo'q) qo'shtirnoq ichida ham bash'ni buzdi — "unexpected EOF" (shellcheck SC1078/SC1011 ushladi).
# Tartib: yangi reliz papkasi → npm ci --omit=dev → migratsiya (alohida rol) → `joriy` symlink'ni atomik almashtirish → pm2 reload (nol uzilish)
#   → health tekshiruvi → yiqilsa ESKI relizga qaytish. Oxirgi 3 reliz saqlanadi.
# 34 #01 (33 BACKLOG): (1) yozish huquqi MIGRATSIYADAN OLDIN tekshiriladi — 33 #27 2-urinishda /opt root'niki edi: migratsiya qo'llandi, symlink almashmadi
#   ("yolg'on yashil"); (2) versiya tekshiruvi — artefakt versiyasi KUTILGAN_VERSIYA ga teng bo'lmasa yoki joriy relizniki bilan bir xil bo'lsa
#   (QAYTA_DEPLOY=1 siz) to'xtaydi; (3) tozalashda joriy va eski (qaytish nuqtasi) reliz HECH QACHON o'chirilmaydi;
#   (4) `tar --no-same-owner` — Windows'da yig'ilgan arxivdagi egasi (UID 197609) serverga ko'chmaydi (33 #07 ogohlantirishi).
set -euo pipefail

ARTEFAKT=${1:?artefakt .tgz fayli kerak}
ILDIZ=${ILDIZ:-/opt/vazifalar-api}
SAQLASH_SONI=${SAQLASH_SONI:-3}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:3000/health/ready}
MIGRATSIYA_ENV=${MIGRATSIYA_ENV:-/etc/vazifalar-api/migratsiya.env}

log() { printf '%s deploy: %s\n' "$(date -u +%T)" "$*"; }

KUTILGAN_VERSIYA=${KUTILGAN_VERSIYA:-}

# (1) yozish huquqi — hech narsa o'zgarmasdan OLDIN (migratsiya bazani o'zgartiradi, uni qaytarib bo'lmaydi)
for d in "$ILDIZ" "$ILDIZ/relizlar"; do
  if [[ -e $d && ! -w $d ]]; then
    log "XATO: $d ga yozib bo'lmaydi ($(stat -c '%U:%G %a' "$d")) — hech narsa o'zgartirilmadi"
    exit 1
  fi
done
mkdir -p "$ILDIZ/relizlar"

RELIZ="$ILDIZ/relizlar/$(date -u +%Y%m%d%H%M%S)"
# 34 #01 o'lchovi: `readlink -f` YO'Q symlink uchun ham yo'lning o'zini qaytaradi — birinchi deployda ESKI=$ILDIZ/joriy bo'lardi
#   (qaytishda `joriy` o'ziga ishora qiladi). Faqat haqiqiy symlink bo'lsa
ESKI=""
if [[ -L $ILDIZ/joriy ]]; then ESKI=$(readlink -f "$ILDIZ/joriy"); fi
mkdir -p "$RELIZ"
log "reliz: $RELIZ (eski: ${ESKI:-yoq})"
# (4) --no-same-owner: fayllar deploy foydalanuvchisiniki bo'ladi (root ishga tushirsa ham arxivdagi begona UID ko'chmaydi)
tar xzf "$ARTEFAKT" --no-same-owner -C "$RELIZ"

# (2) versiya tekshiruvi — noto'g'ri artefakt (eski build, boshqa tarmoq) migratsiyaga yetib bormasin
VERSIYA=$(node -p 'require(process.argv[1]).version' "$RELIZ/package.json")
JORIY_VERSIYA="-"
if [[ -n $ESKI && -f $ESKI/package.json ]]; then JORIY_VERSIYA=$(node -p 'require(process.argv[1]).version' "$ESKI/package.json"); fi
log "versiya: $VERSIYA (joriy: $JORIY_VERSIYA)"
if [[ -n $KUTILGAN_VERSIYA && $VERSIYA != "$KUTILGAN_VERSIYA" ]]; then
  log "XATO: artefakt versiyasi $VERSIYA, kutilgan $KUTILGAN_VERSIYA — to'xtadi"
  rm -rf -- "$RELIZ"
  exit 1
fi
if [[ $VERSIYA == "$JORIY_VERSIYA" && ${QAYTA_DEPLOY:-0} != 1 ]]; then
  log "XATO: $VERSIYA allaqachon joriy (ataylab qayta deploy — QAYTA_DEPLOY=1)"
  rm -rf -- "$RELIZ"
  exit 1
fi

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
    # (3) joriy (yangi) va ESKI (qaytish nuqtasi) ro'yxatdan chiqariladi — soat orqaga ketsa ham (nom tartibi buzilsa) ular o'chmaydi
    find "$ILDIZ/relizlar" -mindepth 1 -maxdepth 1 -type d | sort | head -n -"$SAQLASH_SONI" \
      | { grep -vxF -e "$RELIZ" -e "${ESKI:-/yoq}" || true; } | xargs -r rm -rf --
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
