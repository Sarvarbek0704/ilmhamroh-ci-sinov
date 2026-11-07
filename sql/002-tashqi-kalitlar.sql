-- 002-tashqi-kalitlar.sql — #14 (DB-11): vazifa egasiz qolmasin.
-- 001 da egasi_id oddiy son edi: mavjud bo'lmagan foydalanuvchiga vazifa yozilardi (natijalar/14-*.txt).
-- ON DELETE CASCADE: foydalanuvchi o'chirilsa — uning vazifalari ham (vazifa egasiz ma'nosiz).
ALTER TABLE vazifalar
  ADD CONSTRAINT vazifalar_egasi_id_fkey
  FOREIGN KEY (egasi_id) REFERENCES foydalanuvchilar (id) ON DELETE CASCADE;

-- Postgres FK ustuniga indeksni O'ZI yaratmaydi. Kerak: (1) "foydalanuvchining vazifalari" so'rovi,
-- (2) foydalanuvchi o'chirilganda CASCADE vazifalarni qidiradi — indekssiz butun jadval o'qiladi
CREATE INDEX vazifalar_egasi_id_idx ON vazifalar (egasi_id);
