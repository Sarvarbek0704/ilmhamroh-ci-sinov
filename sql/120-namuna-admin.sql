-- 120-namuna-admin.sql — 28-qism #20: namuna bazada bitta administrator (Bekzod) — RBAC misollari uchun (lokal; prod'da admin qo'lda, migratsiyada emas).
UPDATE foydalanuvchilar SET rol = 'admin' WHERE email = 'bekzod@example.com';
