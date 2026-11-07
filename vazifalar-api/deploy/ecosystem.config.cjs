// deploy/ecosystem.config.cjs — 33-qism #26–#27 (O-28, O-30): PM2 bilan "yalang" VPS deploy (Docker'siz). .cjs — package.json "type": "module".
// Ishga tushirish: pm2 start deploy/ecosystem.config.cjs --env production && pm2 save
// Sozlama — muhitdan: /etc/vazifalar-api/env (systemd unit'dagi bilan bir xil fayl; node --env-file bilan o'qiladi)
module.exports = {
  apps: [
    {
      name: "vazifalar-api",
      script: "dist/main.js",
      cwd: "/opt/vazifalar-api/joriy",
      node_args: "--env-file=/etc/vazifalar-api/env --use-system-ca",
      // cluster: har yadroga nusxa (bir port — PM2 master taqsimlaydi). 33 #26 o'lchovi: 2 yadroli VPS'da 2 nusxa
      exec_mode: "cluster",
      instances: 2,
      // SIGTERM → ilova drain (YOPISH_KECHIKISH_MS + 10 s); PM2 sukuti 1 600 ms — undan keyin SIGKILL (33 #26 o'lchovi)
      kill_timeout: 20000,
      // pm2 reload: yangi nusxa "ready" bermaguncha eskisi to'xtatilmaydi (ilova process.send("ready") yubormaydi — listen'ni kutadi)
      listen_timeout: 15000,
      max_memory_restart: "600M",
      // ketma-ket yiqilishda kutish ortadi (100 ms → … ) — cheksiz tez restart sikli bo'lmasin
      exp_backoff_restart_delay: 100,
      // loglar: PM2 o'z fayllariga (~/.pm2/logs) — pm2-logrotate bilan aylantiriladi
      merge_logs: true,
      time: true,
      // 33 #26 topilmalari (o'z sertifikatli SMTP — lab): (1) --env-file dagi NODE_EXTRA_CA_CERTS ishlamaydi — Node uni ishga tushishda, env fayldan OLDIN o'qiydi;
      // (2) env_production'ga qo'yilsa ham cluster rejimida ishlamaydi — PM2 cluster worker'ining haqiqiy muhitida u yo'q (faqat pm2_env JSON ichida,
      // process.env ga ishga tushgandan KEYIN yoziladi; fork rejimida — bor). Yechim: CA tizim do'koniga (update-ca-certificates) + --use-system-ca.
      // Ommaviy CA'li haqiqiy SMTP'da bularning hech biri kerak emas
      env_production: { NODE_ENV: "production" },
    },
    {
      name: "vazifalar-ishchi",
      script: "dist/ishchi.js",
      cwd: "/opt/vazifalar-api/joriy",
      node_args: "--env-file=/etc/vazifalar-api/env --env-file=/etc/vazifalar-api/ishchi.env --use-system-ca",
      exec_mode: "fork",
      instances: 1,
      kill_timeout: 15000,
      env_production: { NODE_ENV: "production" },
    },
  ],
};
