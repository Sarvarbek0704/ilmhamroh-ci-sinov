-- 013-api-tartib.sql — B bosqich (#41, holat 44): 25-qism API'si (vazifalar-api) talablari uchun sxema o'zgarishi.
-- 1) tartib — foydalanuvchi sudrab tartiblaydi (frontend 20-qism dnd-kit → PUT /v1/vazifalar massiv tartibi); sukut saralash: tartib, keyin id.
-- 2) vaqtlar millisekundgacha — JS Date (va API'dagi ISO satr, kursor) millisekundli; mikrosekund qolsa keyset kursor qatorni qayta
--    qaytaradi (kursordagi .123Z < bazadagi .123456). Trigger'lar va DEFAULT'lar endi date_trunc('milliseconds', now()).
-- 3) foydalanuvchilar.vazifalar_versiyasi — butun ro'yxat versiyasi (API RoyxatNatija.versiya, ro'yxat ETag'i); ombor har yozuvda +1 qiladi.

ALTER TABLE vazifalar ADD COLUMN tartib integer;
UPDATE vazifalar v SET tartib = t.n
FROM (SELECT id, row_number() OVER (PARTITION BY egasi_id ORDER BY yaratilgan_vaqt, id) AS n FROM vazifalar) t
WHERE t.id = v.id;
ALTER TABLE vazifalar ALTER COLUMN tartib SET NOT NULL;

-- tartib berilmasa — egasining oxirgi tartibidan keyin (BEFORE trigger NOT NULL tekshiruvidan OLDIN ishlaydi).
-- Parallel qo'shishda ikki vazifa bir xil tartib olishi mumkin — saralash id bilan tugaydi, shuning uchun tartib barqaror
CREATE FUNCTION tartibni_qoy() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tartib IS NULL THEN
    SELECT coalesce(max(tartib), 0) + 1 INTO NEW.tartib FROM vazifalar WHERE egasi_id = NEW.egasi_id AND ochirilgan_vaqt IS NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER vazifalar_tartib_trg BEFORE INSERT ON vazifalar FOR EACH ROW EXECUTE FUNCTION tartibni_qoy();

-- Sukut ro'yxat so'rovi: WHERE egasi_id ORDER BY tartib, id (+ keyset kursor)
CREATE INDEX vazifalar_tartib_idx ON vazifalar (egasi_id, tartib, id) WHERE ochirilgan_vaqt IS NULL;

-- Millisekund aniqlik
UPDATE vazifalar SET yaratilgan_vaqt = date_trunc('milliseconds', yaratilgan_vaqt),
                     yangilangan_vaqt = date_trunc('milliseconds', yangilangan_vaqt);
ALTER TABLE vazifalar ALTER COLUMN yaratilgan_vaqt SET DEFAULT date_trunc('milliseconds', now()),
                      ALTER COLUMN yangilangan_vaqt SET DEFAULT date_trunc('milliseconds', now());
CREATE OR REPLACE FUNCTION yangilangan_vaqtni_qoy() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.yangilangan_vaqt := date_trunc('milliseconds', now());
  NEW.versiya := OLD.versiya + 1;
  RETURN NEW;
END $$;
-- tartib o'zgarishi ham tahrir (versiya +1): trigger ustunlar ro'yxati qayta yaratiladi
DROP TRIGGER vazifalar_yangilangan_trg ON vazifalar;
CREATE TRIGGER vazifalar_yangilangan_trg
BEFORE UPDATE OF matn, bajarildi, ustuvorlik, muddat, ota_id, ochirilgan_vaqt, tartib ON vazifalar
FOR EACH ROW EXECUTE FUNCTION yangilangan_vaqtni_qoy();

ALTER TABLE foydalanuvchilar ADD COLUMN vazifalar_versiyasi bigint NOT NULL DEFAULT 0;
UPDATE foydalanuvchilar f SET vazifalar_versiyasi = (SELECT count(*) FROM vazifalar v WHERE v.egasi_id = f.id);

-- SELECT * view yangi ustunni ko'rmaydi (#40 topilmasi) — qayta yaratiladi
CREATE OR REPLACE VIEW faol_vazifalar AS SELECT * FROM vazifalar WHERE ochirilgan_vaqt IS NULL;

COMMENT ON COLUMN vazifalar.tartib IS 'Foydalanuvchi tartibi (sudrab tartiblash); berilmasa trigger oxiriga qo''yadi';
COMMENT ON COLUMN foydalanuvchilar.vazifalar_versiyasi IS 'Ro''yxat versiyasi: ombor har yozuvda +1 (API ro''yxat ETag''i)';
