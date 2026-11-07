-- 110-namuna-parol.sql — 28-qism #04: namuna foydalanuvchilarga LOKAL demo parol (faqat dev/kurs bazasi; prod'ga bormaydi — *-namuna-* fayllar).
-- Hamma namuna hisobining paroli: Bahor-choyxona-2026 (hash src/auth/parol.ts bilan, OWASP parametrlari). Shahnozada parol yo'q — parolsiz hisob misoli.
UPDATE foydalanuvchilar
SET parol_hash = '$argon2id$v=19$m=19456,t=2,p=1$FuHrH0GS7kSX0w/HsGJnBQ$a0jJ1YyJgE0+9xRalri+oZOEvN+PZ4edctpmLQUywpI'
WHERE email <> 'shahnoza@example.com';
