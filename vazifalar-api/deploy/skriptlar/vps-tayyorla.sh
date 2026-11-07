#!/usr/bin/env bash
# vps-tayyorla.sh — 33-qism #16 (O-16): yangi Ubuntu 24.04 serverni noldan production'ga tayyorlash. IDEMPOTENT: qayta yurgizish xavfsiz.
# Ishlatish (provayder bergan root sessiyasida, BIRINCHI kirishda):
#   DEPLOY_KALIT="ssh-ed25519 AAAA… siz@noutbuk" bash vps-tayyorla.sh
# Nima qiladi: deploy foydalanuvchisi + kalit + sudo; ilova foydalanuvchisi; SSH hardening (root va parol o'chiq); ufw (22, 80, 443); fail2ban;
# unattended-upgrades; vaqt mintaqasi; swap (bo'lmasa); journald chegarasi; nginx (nginx.org stable) va Node 24 (NodeSource).
# DIQQAT: skript tugaguncha root sessiyasini YOPMANG — yangi oynada `ssh deploy@server` bilan kirib ko'ring.
set -euo pipefail

DEPLOY_USER=${DEPLOY_USER:-deploy}
ILOVA_USER=${ILOVA_USER:-vazifalar}
VAQT_MINTAQASI=${VAQT_MINTAQASI:-UTC}   # server soati UTC; foydalanuvchi vaqti — ilovada (APP_TZ=Asia/Tashkent)
SWAP_HAJMI=${SWAP_HAJMI:-1G}
NODE_MAJOR=${NODE_MAJOR:-24}
BU_PAPKA=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

qadam() { printf '\n== %s\n' "$*"; }
xato() { printf 'XATO: %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || xato "root sifatida ishga tushiring"
[[ -n ${DEPLOY_KALIT:-} ]] || xato "DEPLOY_KALIT (ochiq SSH kalit) berilmagan — busiz hardening sizni serverdan chiqarib yuboradi"
grep -q 'VERSION_ID="24.04"' /etc/os-release || xato "faqat Ubuntu 24.04 da sinalgan"
export DEBIAN_FRONTEND=noninteractive

qadam "1. paketlar indeksi va xavfsizlik yangilanishlari"
apt-get update -q
apt-get upgrade -y -q
apt-get install -y -q ca-certificates curl gnupg ufw fail2ban unattended-upgrades

qadam "2. deploy foydalanuvchisi (minimal sudo ro'yxati) va SSH kaliti"
if ! id "$DEPLOY_USER" > /dev/null 2>&1; then
  adduser --disabled-password --gecos "Deploy" "$DEPLOY_USER"
fi
# sudo GURUHIGA QO'SHILMAYDI (parolsiz hisob — u guruhda baribir ishlatolmaydi, parol qo'yilsa esa to'liq root). Faqat ruxsat ro'yxati (pastda).
# Loglarni o'qish — sudo'siz: systemd-journal (journalctl) va adm (/var/log/nginx) guruhlari
gpasswd -d "$DEPLOY_USER" sudo > /dev/null 2>&1 || true
usermod -aG systemd-journal,adm "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
KALITLAR="/home/$DEPLOY_USER/.ssh/authorized_keys"
touch "$KALITLAR"
grep -qxF "$DEPLOY_KALIT" "$KALITLAR" || printf '%s\n' "$DEPLOY_KALIT" >> "$KALITLAR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$KALITLAR"
chmod 600 "$KALITLAR"
# sudo — faqat ruxsat ro'yxati (deploy/sudoers/deploy): xizmatlarni qayta ishga tushirish/holat, nginx -t va reload. ANTI-NAQSH: `deploy ALL=(ALL) NOPASSWD:ALL`
# (kalit o'g'irlansa — to'liq root; 33 #16 ning 1-versiyasi shunday edi, bosh muharrir qarori bilan almashtirildi). Server ma'muriyati — root/konsol orqali.
# Avval vaqtinchalik faylda visudo -c — xato bo'lsa eski fayl joyida qoladi (sudo buzilmaydi)
sed "s/^deploy /$DEPLOY_USER /" "$BU_PAPKA/../sudoers/deploy" > "/etc/sudoers.d/.90-$DEPLOY_USER.yangi"
chmod 440 "/etc/sudoers.d/.90-$DEPLOY_USER.yangi"
visudo -cf "/etc/sudoers.d/.90-$DEPLOY_USER.yangi" > /dev/null
mv "/etc/sudoers.d/.90-$DEPLOY_USER.yangi" "/etc/sudoers.d/90-$DEPLOY_USER"

qadam "3. ilova foydalanuvchisi (shell'siz)"
id "$ILOVA_USER" > /dev/null 2>&1 || useradd --system --home-dir "/opt/$ILOVA_USER" --shell /usr/sbin/nologin "$ILOVA_USER"

qadam "4. SSH hardening (drop-in) — avval sshd -t"
install -m 644 "$BU_PAPKA/../ssh/10-hardening.conf" /etc/ssh/sshd_config.d/10-hardening.conf
sed -i "s/^AllowUsers .*/AllowUsers $DEPLOY_USER/" /etc/ssh/sshd_config.d/10-hardening.conf
sshd -t
systemctl reload ssh

qadam "5. ufw: kiruvchi — faqat SSH, HTTP, HTTPS (443/udp — HTTP/3)"
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null
ufw allow OpenSSH > /dev/null
ufw allow 80/tcp > /dev/null
ufw allow 443 > /dev/null
ufw --force enable > /dev/null
ufw status | sed -n '1,8p'

qadam "6. fail2ban (sshd jail, journald)"
install -m 644 "$BU_PAPKA/../fail2ban/sshd.local" /etc/fail2ban/jail.d/sshd.local
systemctl enable --now fail2ban > /dev/null 2>&1
systemctl restart fail2ban

qadam "7. avtomatik xavfsizlik yangilanishlari"
printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' > /etc/apt/apt.conf.d/20auto-upgrades

qadam "8. vaqt mintaqasi: $VAQT_MINTAQASI"
timedatectl set-timezone "$VAQT_MINTAQASI" 2> /dev/null || ln -sf "/usr/share/zoneinfo/$VAQT_MINTAQASI" /etc/localtime

qadam "9. swap ($SWAP_HAJMI)"
if swapon --show=NAME --noheadings | grep -q '^/swapfile$'; then
  echo "swap bor"
elif systemd-detect-virt --container > /dev/null 2>&1; then
  echo "konteyner ichida — swap host kernelida, o'tkazildi"
else
  [[ -f /swapfile ]] || { fallocate -l "$SWAP_HAJMI" /swapfile; chmod 600 /swapfile; mkswap /swapfile > /dev/null; }
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -q vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/90-swap.conf
fi

qadam "10. journald hajm chegarasi"
install -d /etc/systemd/journald.conf.d
install -m 644 "$BU_PAPKA/../journald/10-vazifalar.conf" /etc/systemd/journald.conf.d/10-vazifalar.conf
systemctl restart systemd-journald

qadam "11. nginx (nginx.org stable repo)"
if [[ ! -f /usr/share/keyrings/nginx-archive-keyring.gpg ]]; then
  curl -fsSL https://nginx.org/keys/nginx_signing.key | gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg
fi
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/ubuntu noble nginx" > /etc/apt/sources.list.d/nginx.list
printf 'Package: *\nPin: origin nginx.org\nPin-Priority: 900\n' > /etc/apt/preferences.d/99nginx
# nginx.org paketlari Ubuntu xavfsizlik kanalida emas — unattended-upgrades ularni ham yangilasin
printf 'Unattended-Upgrade::Origins-Pattern { "origin=nginx"; };\n' > /etc/apt/apt.conf.d/52unattended-nginx

qadam "12. Node.js $NODE_MAJOR (NodeSource repo)"
if [[ ! -f /etc/apt/sources.list.d/nodesource.sources && ! -f /etc/apt/sources.list.d/nodesource.list ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource_setup.sh
  bash /tmp/nodesource_setup.sh > /dev/null
  rm -f /tmp/nodesource_setup.sh
fi
apt-get update -q
apt-get install -y -q nginx nodejs
# enable --now: idempotent; konteyner-lab'da policy-rc.d (exit 101) apt paytida xizmatlarni ishga tushirmaydi — shu qator ishga tushiradi
systemctl enable --now nginx > /dev/null 2>&1

qadam "TAYYOR — tekshiruv"
printf 'ssh: %s\n' "$(sshd -T | grep -E '^(permitrootlogin|passwordauthentication|allowusers) ' | tr '\n' ' ')"
printf 'ufw: %s | fail2ban: %s | nginx: %s (%s) | node: %s\n' "$(ufw status | head -1)" "$(systemctl is-active fail2ban)" \
  "$(systemctl is-active nginx)" "$(nginx -v 2>&1 | cut -d/ -f2)" "$(node -v)"
echo "Endi YANGI oynada: ssh $DEPLOY_USER@<server> — kirganingizni tekshirib, keyingina root sessiyasini yoping."
