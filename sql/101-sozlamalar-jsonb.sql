-- 101-sozlamalar-jsonb.sql — 27-qism #01 (DB-62, holat 01): foydalanuvchi sozlamalari — JSONB.
-- Nega JSONB: frontend sozlamalari (21-qism: til, mavzu, bildirishnoma) tez-tez o'zgaradi, har biri bo'yicha JOIN/hisobot qilinmaydi,
-- hammasi bitta obyekt bo'lib o'qiladi/yoziladi. Qidiriladigan, FK yoki qat'iy turli maydonlar — oddiy ustun bo'lib qoladi.
-- 27-qism fayllari 101 dan boshlanadi: 001–0NN — 26-qism kanoni (sinov/26/sql nusxasi), u tugaguncha yangi raqam qo'shishi mumkin.

ALTER TABLE foydalanuvchilar ADD COLUMN sozlamalar jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Faqat obyekt; ma'lum kalitlarning turi va qiymatlari tekshiriladi, noma'lum kalitlar — ruxsat (oldinga moslik)
ALTER TABLE foydalanuvchilar ADD CONSTRAINT foydalanuvchilar_sozlamalar_check CHECK (
  jsonb_typeof(sozlamalar) = 'object'
  AND (NOT sozlamalar ? 'til' OR sozlamalar->>'til' IN ('uz-Latn', 'uz-Cyrl', 'ru', 'en'))
  AND (NOT sozlamalar ? 'mavzu' OR sozlamalar->>'mavzu' IN ('yorug', 'qorongi', 'tizim'))
  AND (NOT sozlamalar ? 'bildirishnoma' OR jsonb_typeof(sozlamalar->'bildirishnoma') = 'object')
);

-- "Kim qorong'i mavzuda / kimga email bildirishnoma ketadi" — @> so'rovlari uchun (jsonb_path_ops — kichikroq, faqat @> va @?)
CREATE INDEX foydalanuvchilar_sozlamalar_idx ON foydalanuvchilar USING gin (sozlamalar jsonb_path_ops);

COMMENT ON COLUMN foydalanuvchilar.sozlamalar IS 'Interfeys sozlamalari: til, mavzu, bildirishnoma{email,telegram}; noma''lum kalitlar saqlanadi';
