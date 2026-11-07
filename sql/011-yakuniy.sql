-- 011-yakuniy.sql — #40 (DB-37): sxema review natijasi — yakuniy A bosqich sxemasi.
-- Review topilmalari va qarorlar — QADAMLAR.md #40.

-- 1) Optimistik qulf (DB-49, B bosqich) uchun versiya: har mazmunli o'zgarishda +1.
--    Ilova: UPDATE ... WHERE id = $1 AND versiya = $2 — 0 qator = boshqa kimdir avval o'zgartirgan (409).
ALTER TABLE vazifalar ADD COLUMN versiya integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION yangilangan_vaqtni_qoy() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.yangilangan_vaqt := now();
  NEW.versiya := OLD.versiya + 1;   -- ilova versiyani o'zi oshirmaydi — trigger kafolatlaydi
  RETURN NEW;
END $$;

-- 2) SELECT * bilan yaratilgan view ustunlar ro'yxatini YARATILGAN PAYTDA qotiradi: 010 dan keyin qo'shilgan
--    versiya faol_vazifalar da yo'q edi (natijalar/40-review.txt). Qayta yaratiladi — yangi ustunlar oxiriga.
CREATE OR REPLACE VIEW faol_vazifalar AS
  SELECT * FROM vazifalar WHERE ochirilgan_vaqt IS NULL;

-- 3) Asosiy so'rov uchun indeks (oldindan rejalashtirilgan, o'lchovi — B bosqich #57, #64):
--    "foydalanuvchining faol vazifalari, yangilari birinchi" + keyset pagination (yaratilgan_vaqt, id)
CREATE INDEX vazifalar_royxat_idx ON vazifalar (egasi_id, yaratilgan_vaqt DESC, id DESC)
  WHERE ochirilgan_vaqt IS NULL;

-- 4) Hujjat bazaning o'zida: \d+ va GUI klientlar shu izohlarni ko'rsatadi
COMMENT ON TABLE foydalanuvchilar IS 'Ilova foydalanuvchilari. Auth maydonlari (parol hash, sessiya) — 28-qism';
COMMENT ON TABLE vazifalar IS 'Vazifalar. Teglar matndagi #tegdan trigger bilan (vazifa_teglari); o''chirish — yumshoq (ochirilgan_vaqt)';
COMMENT ON COLUMN vazifalar.matn IS '1–100 belgi, chetida bo''shliqsiz; o''chirilmaganlar orasida egasi bo''yicha registrga befarq noyob';
COMMENT ON COLUMN vazifalar.ota_id IS 'Kichik vazifa bo''lsa — ota vazifa (o''sha egasiniki, tarkibiy FK)';
COMMENT ON COLUMN vazifalar.izohlar_soni IS 'Counter cache — izohlar_soni_trg yangilaydi; qo''lda yozilmaydi';
COMMENT ON COLUMN vazifalar.versiya IS 'Optimistik qulf: har tahrirda trigger +1 qiladi';
COMMENT ON COLUMN vazifalar.ochirilgan_vaqt IS 'NULL — faol; vaqt — Savatda (yumshoq o''chirilgan)';
COMMENT ON TABLE teglar IS 'Foydalanuvchining teglari, kichik harfda, # bilan';
COMMENT ON TABLE vazifa_teglari IS 'N:M — vazifa va teg; vazifa_teglari_trg matndan to''ldiradi';
COMMENT ON TABLE izohlar IS '1:N — vazifa izohlari';
COMMENT ON TABLE vazifa_tarixi IS 'Audit: har INSERT/UPDATE/DELETE ning eski va yangi qiymati (jsonb). kim_id — SET LOCAL ilova.foydalanuvchi_id';
