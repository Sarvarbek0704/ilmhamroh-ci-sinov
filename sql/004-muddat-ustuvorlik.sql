-- 004-muddat-ustuvorlik.sql — #21 (DB-18): ishlab turgan jadvalga yangi ustunlar (ALTER TABLE).
-- Ustuvorlik — ENUM (DB-36, #39): qiymatlar e'lon tartibida saralanadi (past < orta < yuqori);
-- matn + CHECK bo'lganda ORDER BY alifbo bo'yicha bo'lardi: orta, past, yuqori.
CREATE TYPE ustuvorlik AS ENUM ('past', 'orta', 'yuqori');

ALTER TABLE vazifalar
  -- DEFAULT bilan NOT NULL ustun: PG 11+ da jadvalni qayta yozmaydi (tez), mavjud qatorlar 'orta' oladi
  ADD COLUMN ustuvorlik      ustuvorlik  NOT NULL DEFAULT 'orta',
  ADD COLUMN muddat          timestamptz,           -- NULL = muddatsiz
  ADD COLUMN bajarilgan_vaqt timestamptz,
  ADD COLUMN ota_id          bigint;                -- kichik vazifa: qaysi vazifaning qadami (#27 rekursiv CTE)

-- Mavjud bajarilgan vazifalar qachon bajarilgani NOMA'LUM. Eng erta mumkin bo'lgan qiymat — yaratilgan vaqt
-- (namuna ma'lumotda 005 aniqroq vaqtlar bilan almashtiradi)
UPDATE vazifalar SET bajarilgan_vaqt = yaratilgan_vaqt WHERE bajarildi;

ALTER TABLE vazifalar
  -- ikki ustun bir-biriga zid bo'lmasin: bajarildi = true <=> bajarilgan_vaqt bor
  ADD CONSTRAINT vazifalar_bajarilgan_vaqt_check CHECK (bajarildi = (bajarilgan_vaqt IS NOT NULL)),
  ADD CONSTRAINT vazifalar_ota_id_check CHECK (ota_id <> id),
  -- kichik vazifa faqat O'SHA egasining vazifasiga ulanadi: tarkibiy (composite) FK (id, egasi_id) ga
  ADD CONSTRAINT vazifalar_id_egasi_id_key UNIQUE (id, egasi_id),
  ADD CONSTRAINT vazifalar_ota_id_fkey FOREIGN KEY (ota_id, egasi_id)
    REFERENCES vazifalar (id, egasi_id) ON DELETE CASCADE;

-- ko'p vazifaning otasi yo'q — indeks faqat ota_id bor qatorlarga (partial, #58)
CREATE INDEX vazifalar_ota_id_idx ON vazifalar (ota_id) WHERE ota_id IS NOT NULL;
