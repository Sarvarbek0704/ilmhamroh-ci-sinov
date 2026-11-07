-- 010-vaqt-tarix.sql — #38 (DB-35): yangilangan vaqt, yumshoq o'chirish (soft delete) va o'zgarishlar tarixi.

-- 1) yangilangan_vaqt — har mazmunli o'zgarishda trigger qo'yadi (ilova unutib qo'ymasin)
-- ochirilgan_vaqt (2-band) ham shu yerda: trigger ustunlar ro'yxatida u bor, ustun avval yaratilishi kerak
ALTER TABLE vazifalar ADD COLUMN yangilangan_vaqt timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN ochirilgan_vaqt timestamptz;
UPDATE vazifalar SET yangilangan_vaqt = coalesce(bajarilgan_vaqt, yaratilgan_vaqt);

CREATE FUNCTION yangilangan_vaqtni_qoy() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.yangilangan_vaqt := now();  -- now() — tranzaksiya boshlangan vaqt
  RETURN NEW;                     -- BEFORE trigger: shu qator yoziladi
END $$;

-- Faqat foydalanuvchi o'zgartiradigan ustunlar: izohlar_soni (counter cache) o'zgarishi "tahrir" emas
CREATE TRIGGER vazifalar_yangilangan_trg
BEFORE UPDATE OF matn, bajarildi, ustuvorlik, muddat, ota_id, ochirilgan_vaqt ON vazifalar
FOR EACH ROW EXECUTE FUNCTION yangilangan_vaqtni_qoy();

-- 2) Yumshoq o'chirish: qator qoladi, ochirilgan_vaqt qo'yiladi ("Savat"dan tiklash mumkin)

-- Frontend qoidasi "Bu vazifa ro'yxatda allaqachon bor" (registrga befarq, 22-qism royxat.ts) — endi bazada.
-- Faqat O'CHIRILMAGANLAR orasida noyob: o'chirilgan vazifa matnini qayta yozish mumkin (partial unique, #58)
CREATE UNIQUE INDEX vazifalar_egasi_id_matn_key ON vazifalar (egasi_id, lower(matn))
  WHERE ochirilgan_vaqt IS NULL;

-- Ko'p so'rov "faqat o'chirilmaganlar" — ko'rinish (view) shartni har safar yozishdan saqlaydi
CREATE VIEW faol_vazifalar AS
  SELECT * FROM vazifalar WHERE ochirilgan_vaqt IS NULL;

-- 3) Tarix jadvali: kim, qachon, nimani o'zgartirdi. vazifa_id — FK EMAS: vazifa butunlay o'chsa ham tarix qoladi
CREATE TABLE vazifa_tarixi (
  id        bigint      GENERATED ALWAYS AS IDENTITY,
  vazifa_id bigint      NOT NULL,
  amal      text        NOT NULL,
  eski      jsonb,
  yangi     jsonb,
  -- kim: ilova har tranzaksiyada SET LOCAL ilova.foydalanuvchi_id = '…' qiladi (B bosqich); bo'lmasa NULL
  kim_id    bigint,
  vaqt      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vazifa_tarixi_pkey PRIMARY KEY (id),
  CONSTRAINT vazifa_tarixi_amal_check CHECK (amal IN ('INSERT', 'UPDATE', 'DELETE'))
);
CREATE INDEX vazifa_tarixi_vazifa_id_vaqt_idx ON vazifa_tarixi (vazifa_id, vaqt);

CREATE FUNCTION vazifa_tarixini_yoz() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  kim bigint := nullif(current_setting('ilova.foydalanuvchi_id', true), '')::bigint;
BEGIN
  INSERT INTO vazifa_tarixi (vazifa_id, amal, eski, yangi, kim_id)
  VALUES (
    coalesce(NEW.id, OLD.id), TG_OP,
    CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) - 'izohlar_soni' END,
    CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) - 'izohlar_soni' END,
    kim);
  RETURN NULL;
END $$;

CREATE TRIGGER vazifa_tarixi_trg
AFTER INSERT OR DELETE OR UPDATE OF matn, bajarildi, ustuvorlik, muddat, ota_id, ochirilgan_vaqt ON vazifalar
FOR EACH ROW EXECUTE FUNCTION vazifa_tarixini_yoz();
