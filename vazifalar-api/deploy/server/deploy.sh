#!/bin/bash
# deploy/server/deploy.sh — 34-qism #06 (O-48): serverdagi YAGONA deploy kirish nuqtasi. O'rnatish: /opt/<loyiha>/bin/deploy (root:root 0755).
#   CI quyidagicha chaqiradi:  ssh <deploy-foydalanuvchi>@server sha-<40 hex>   (yoki v1.2.3)
#   authorized_keys: restrict,command="sudo /opt/<loyiha>/bin/deploy" ssh-ed25519 AAAA…  — kalit FAQAT shu skriptni ishga tushira oladi,
#   so'ralgan buyruq SSH_ORIGINAL_COMMAND da keladi va bu yerda QAT'IY regex bilan tekshiriladi (shell, scp, port forwarding — yo'q).
#   sudoers: <deploy-foydalanuvchi> ALL=(root) NOPASSWD: /opt/<loyiha>/bin/deploy   (docker guruhi BERILMAYDI — docker = root).
# Ish tartibi: teg tekshiruvi → qulf (flock) → image'larni tortish → migratsiya (bir martalik) → api/ishchi/web yangilash → health → teg yozish.
#   Yiqilsa — oldingi tegga avtomatik qaytish (migratsiya qaytarilmaydi: expand/contract, 27-qism).
set -euo pipefail
umask 077

ILDIZ=${ILDIZ:-/opt/kanon34}
LOYIHA=${LOYIHA:-kanon34}
REGISTRY=${REGISTRY:-ghcr.io/sarvarbek0704/ilmhamroh-ci-sinov}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:4790/v1/vazifalar}   # web → api; sessiyasiz 401 = zanjir tirik
LOG=$ILDIZ/deploy.log

# 34 #06 1-urinish: SSH klienti uzilsa (CI/klient timeout) `tee` stdout'ga yozolmay SIGPIPE oldi va `set -e` deploy'ni YARMIDA o'ldirdi (logda natija yo'q).
#   Endi: SIGHUP/SIGPIPE e'tiborsiz, log avval faylga, ekranga — xatosi yutiladi. Deploy klientdan qat'i nazar oxirigacha boradi (qulf — flock).
trap '' HUP PIPE
log() {
  local q
  q="$(date -u +%FT%TZ) $*"
  printf '%s\n' "$q" >> "$LOG"
  printf '%s\n' "$q" 2> /dev/null || true
}

KIRISH=${SSH_ORIGINAL_COMMAND:-${1:-}}
# faqat image tegi: sha-<40 hex> yoki vX.Y.Z — bo'shliq, ;, $, ` va boshqa hech narsa o'tmaydi
if [[ ! $KIRISH =~ ^(sha-[0-9a-f]{40}|v[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})$ ]]; then
  log "RAD ETILDI: '${KIRISH:0:80}' (kutilgan: sha-<40 hex> yoki vX.Y.Z)"
  exit 64
fi
TEG=$KIRISH

exec 9> "$ILDIZ/deploy.lock"
if ! flock -n 9; then log "RAD ETILDI: boshqa deploy ishlayapti"; exit 75; fi

cd "$ILDIZ/app"
dc() { API_IMAGE="$REGISTRY/api:$1" WEB_IMAGE="$REGISTRY/web:$1" docker compose -p "$LOYIHA" -f compose.yaml -f compose.prod.yaml --profile sinov "${@:2}"; }

tayyor() { # tayyor <teg> — 60 s ichida zanjir (host → web → api) javob beradimi
  for _ in $(seq 1 60); do
    kod=$(curl -s -o /dev/null -m 3 -w '%{http_code}' "$HEALTH_URL" || true)
    [[ $kod == 401 ]] && return 0
    sleep 1
  done
  return 1
}

# DIQQAT (34 #06 1-urinish): `if ornat …` ichida `set -e` ISHLAMAYDI (bash: if/&&/|| kontekstidagi funksiyada xato to'xtatmaydi) — yo'q teg bilan
#   `docker pull` yiqildi, skript davom etdi va Compose image'ni serverda QURISHGA urindi ("failed to read dockerfile"). Shuning uchun har qadam `|| return 1`,
#   compose — `--no-build` (serverda build hech qachon bo'lmaydi: image faqat registry'dan).
ornat() { # ornat <teg>
  local t=$1
  log "[$t] image'lar tortilmoqda"
  timeout 300 docker pull -q "$REGISTRY/api:$t" > /dev/null || { log "[$t] XATO: api image tortilmadi"; return 1; }
  timeout 300 docker pull -q "$REGISTRY/web:$t" > /dev/null || { log "[$t] XATO: web image tortilmadi"; return 1; }
  log "[$t] migratsiya"
  dc "$t" up -d --no-build --wait db redis pochta > /dev/null 2>&1 || { log "[$t] XATO: db/redis tayyor emas"; return 1; }
  dc "$t" run --rm --no-deps migratsiya > /dev/null 2>&1 || { log "[$t] XATO: migratsiya yiqildi"; return 1; }
  log "[$t] api, ishchi, web yangilanmoqda"
  dc "$t" up -d --no-build --no-deps --wait --wait-timeout 120 api ishchi web > /dev/null 2>&1 || { log "[$t] XATO: konteynerlar healthy bo'lmadi"; return 1; }
  tayyor "$t" || { log "[$t] XATO: $HEALTH_URL 60 s da 401 bermadi"; return 1; }
}

OLDINGI=$(cat "$ILDIZ/joriy-teg" 2> /dev/null || echo "")
log "DEPLOY boshlandi: $TEG (oldingi: ${OLDINGI:-yoq})"
B0=$(date +%s)
if ornat "$TEG"; then
  echo "$TEG" > "$ILDIZ/joriy-teg"
  [[ -n $OLDINGI && $OLDINGI != "$TEG" ]] && echo "$OLDINGI" > "$ILDIZ/oldingi-teg"
  log "TAYYOR: $TEG ($(( $(date +%s) - B0 )) s)"
  exit 0
fi
log "XATO: $TEG tayyor bo'lmadi"
if [[ -n $OLDINGI && $OLDINGI != "$TEG" ]]; then
  log "QAYTISH: $OLDINGI"
  if ornat "$OLDINGI"; then log "qaytildi: $OLDINGI"; else log "QAYTISH HAM YIQILDI — qo'lda tekshiring"; fi
fi
exit 1
