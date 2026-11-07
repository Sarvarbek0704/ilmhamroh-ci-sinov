#!/bin/bash
# deploy/server/tayyorla.sh — 34-qism #06 (O-48): serverda CI uchun CHEKLANGAN deploy foydalanuvchisini tayyorlash (root bir marta ishga tushiradi; idempotent).
#   bash tayyorla.sh <loyiha> "<ssh-ed25519 ochiq kalit>"      masalan: bash tayyorla.sh kanon34 "ssh-ed25519 AAAA… ci-deploy"
# Natija: foydalanuvchi parolsiz (kirish faqat kalit bilan), sudo/docker guruhisiz; kalit bilan FAQAT /opt/<loyiha>/bin/deploy ishlaydi.
set -euo pipefail
LOYIHA=${1:?loyiha nomi kerak}
KALIT=${2:?ochiq kalit kerak}
[[ $LOYIHA =~ ^[a-z][a-z0-9-]{1,30}$ ]] || { echo "noto'g'ri nom"; exit 2; }
[[ $KALIT =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+(\ [A-Za-z0-9@._-]+)?$ ]] || { echo "kalit ssh-ed25519 bo'lishi kerak"; exit 2; }
ILDIZ=/opt/$LOYIHA

# 1) foydalanuvchi: parolsiz (shadow'da "!" — parol bilan kirib bo'lmaydi), qo'shimcha guruhsiz
id "$LOYIHA" > /dev/null 2>&1 || useradd --create-home --shell /bin/bash "$LOYIHA"
passwd -l "$LOYIHA" > /dev/null

# 2) skript va papkalar — root'niki: deploy foydalanuvchisi skriptni O'ZGARTIRA OLMAYDI (aks holda sudo = root)
install -d -o root -g root -m 755 "$ILDIZ" "$ILDIZ/bin" "$ILDIZ/app"
install -o root -g root -m 755 "$(dirname "$0")/deploy.sh" "$ILDIZ/bin/deploy"

# 3) sudoers: faqat bitta skript, argumentsiz qoida — argumentni skript o'zi SSH_ORIGINAL_COMMAND dan oladi va tekshiradi.
#    Avval vaqtinchalik (nuqtali — sudo o'qimaydi) faylda visudo -cf, keyin mv (xato bo'lsa sudo buzilmaydi)
printf '%s ALL=(root) NOPASSWD: %s/bin/deploy\n' "$LOYIHA" "$ILDIZ" > "/etc/sudoers.d/.$LOYIHA.yangi"
chmod 440 "/etc/sudoers.d/.$LOYIHA.yangi"
visudo -cf "/etc/sudoers.d/.$LOYIHA.yangi"
mv "/etc/sudoers.d/.$LOYIHA.yangi" "/etc/sudoers.d/$LOYIHA"

# 4) authorized_keys — root'niki (foydalanuvchi o'z kalitlar ro'yxatini o'zgartira olmaydi), bitta kalit, majburiy buyruq:
#    restrict = no-port/agent/X11-forwarding, no-pty, no-user-rc; command= — klient nima so'rasa ham FAQAT shu ishlaydi
#    (so'ralgan satr SSH_ORIGINAL_COMMAND da). sudo `env_reset` bu o'zgaruvchini o'chiradi, shuning uchun command= uni qo'shtirnoq ichida BITTA
#    argument qilib beradi ("$SSH_ORIGINAL_COMMAND" — kengaytma natijasi qayta tahlil qilinmaydi: `;`, `$( )` matn bo'lib qoladi). Tekshiruv — deploy ichida.
install -d -o root -g root -m 755 "/home/$LOYIHA/.ssh"
# shellcheck disable=SC2016 # $SSH_ORIGINAL_COMMAND ataylab kengaytirilmaydi — u authorized_keys ga matn bo'lib yoziladi
printf 'restrict,command="sudo %s/bin/deploy \\"$SSH_ORIGINAL_COMMAND\\"" %s\n' "$ILDIZ" "$KALIT" > "/home/$LOYIHA/.ssh/authorized_keys"
chown root:root "/home/$LOYIHA/.ssh/authorized_keys"
chmod 644 "/home/$LOYIHA/.ssh/authorized_keys"
echo "tayyor: $LOYIHA ($(id "$LOYIHA")), $ILDIZ/bin/deploy $(stat -c '%U:%G %a' "$ILDIZ/bin/deploy")"
