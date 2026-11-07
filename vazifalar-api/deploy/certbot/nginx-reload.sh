#!/bin/sh
# deploy/certbot/nginx-reload.sh — 34 #01 (33 BACKLOG): sertifikat YANGILANGANDAN keyin nginx yangi faylni o'qishi uchun (aks holda eski sertifikat
#   xotirada qoladi va 90 kundan keyin muddati o'tadi — certbot "renewed" deydi, brauzer esa xato ko'radi).
# O'rnatish (ikki yo'l):
#   a) hamma sertifikat uchun:   install -m 755 nginx-reload.sh /etc/letsencrypt/renewal-hooks/deploy/
#   b) faqat bitta sertifikat:   certbot certonly --webroot -w /var/www/certbot -d <domen> --deploy-hook "/usr/local/sbin/nginx-reload.sh"
#      (renewal/<domen>.conf ga `renew_hook = …` bo'lib yoziladi; 34 #06 da asosiy serverda shu yo'l — boshqa sertifikatlarga tegmaslik uchun)
# Sinov: certbot renew --cert-name <domen> --dry-run --run-deploy-hooks --no-random-sleep-on-renew
# RENEWED_DOMAINS — certbot beradi. nginx -t xato bo'lsa reload QILINMAYDI (eski konfiguratsiya ishlashda davom etadi).
set -eu
if nginx -t -q; then
  systemctl reload nginx
  echo "nginx-reload: ${RENEWED_DOMAINS:-?} uchun nginx qayta yuklandi"
else
  echo "nginx-reload: nginx -t XATO — reload qilinmadi" >&2
  exit 1
fi
