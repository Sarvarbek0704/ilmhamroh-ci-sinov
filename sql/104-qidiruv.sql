-- 104-qidiruv.sql — 27-qism #07 (DB-68, holat 07): vazifalar bo'yicha qidiruv — full-text (tsvector) + pg_trgm (xatoli yozuv).
-- O'zbek tili uchun Postgres'da lug'at (stemming) YO'Q → 'simple' konfiguratsiya (so'zni o'zgartirmaydi, faqat kichik harf).
-- Muammo (o'lchandi, natijalar/07-fts.txt): 'simple' parser oddiy apostrofni (') va ’ ni so'z ajratuvchi deb biladi:
--   o'qish → 'o' + 'qish'; ʻ (U+02BB) esa harf → 'oʻqish' bitta so'z. Yechim — normallashtirish: hamma apostrof shakllari → ʻ (U+02BB),
--   kirill → lotin (foydalanuvchi "ўқиш" deb qidirsa ham topilsin), unaccent (é → e). Shu funksiya ham matnga, ham so'rovga qo'llanadi.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- IMMUTABLE va'dasi: unaccent() o'zi STABLE (lug'at o'zgarishi mumkin) — lug'atni aniq ko'rsatib o'rab IMMUTABLE deymiz
-- (generated ustun va indeks uchun shart). unaccent lug'ati yangilansa — REINDEX/qayta hisoblash kerak (izohda ochiq aytilgan).
CREATE FUNCTION uz_normal(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
-- tartib muhim (o'lchandi): unaccent ʻ ni ASCII ' ga aylantiradi va ё → е qiladi — shuning uchun 1) kirill → lotin,
-- 2) unaccent, 3) OXIRIDA hamma apostrof shakllari → ʻ
RETURN translate(
  public.unaccent('public.unaccent'::regdictionary,
    translate(
      replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
        lower(t),
        'ў', 'oʻ'), 'ғ', 'gʻ'), 'ш', 'sh'), 'ч', 'ch'), 'ё', 'yo'), 'ю', 'yu'), 'я', 'ya'), 'ц', 'ts'), 'щ', 'sh'), 'қ', 'q'), 'ҳ', 'h'), 'ъ', 'ʻ'),
      'абвгдежзийклмнопрстуфхэь',
      'abvgdejziyklmnoprstufxe')),
  'ʼ''’‘`´', 'ʻʻʻʻʻʻ');

ALTER TABLE vazifalar ADD COLUMN qidiruv tsvector
  GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, uz_normal(matn))) STORED;

CREATE INDEX vazifalar_qidiruv_idx ON vazifalar USING gin (qidiruv);
-- Xatoli yozuv / so'z bo'lagi (ILIKE '%…%', similarity) uchun trigram
CREATE INDEX vazifalar_matn_trgm_idx ON vazifalar USING gin (uz_normal(matn) gin_trgm_ops);

-- SELECT * view yangi ustunni ko'rmaydi (26 #40 topilmasi) — qayta yaratiladi
CREATE OR REPLACE VIEW faol_vazifalar AS SELECT * FROM vazifalar WHERE ochirilgan_vaqt IS NULL;

COMMENT ON FUNCTION uz_normal(text) IS 'Qidiruv uchun: kichik harf, kirill→lotin, apostroflar→ʻ, unaccent. IMMUTABLE — unaccent lug''ati o''zgarsa REINDEX';
COMMENT ON COLUMN vazifalar.qidiruv IS 'to_tsvector(simple, uz_normal(matn)) — STORED generated, GIN indeks';
