-- 009-hisoblangan.sql — #36 (DB-33): hisoblangan (denormalizatsiya qilingan) ma'lumot trigger bilan sinxron.
-- 1) izohlar_soni — counter cache: ro'yxatda har vazifa uchun COUNT(*) qilmaslik uchun.
-- 2) vazifa_teglari — matndagi #teglardan avtomatik: ilova faqat matnni yozadi, teglar o'zi yangilanadi.
-- Narxi: har izoh yozish vazifa qatorini ham yangilaydi (qulf, #51), matn o'zgarsa teglar qayta yoziladi.

ALTER TABLE vazifalar ADD COLUMN izohlar_soni integer NOT NULL DEFAULT 0,
  ADD CONSTRAINT vazifalar_izohlar_soni_check CHECK (izohlar_soni >= 0);

UPDATE vazifalar v SET izohlar_soni = s.soni
FROM (SELECT vazifa_id, count(*) AS soni FROM izohlar GROUP BY vazifa_id) s
WHERE s.vazifa_id = v.id;

CREATE FUNCTION izohlar_sonini_yangila() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vazifalar SET izohlar_soni = izohlar_soni + 1 WHERE id = NEW.vazifa_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vazifalar SET izohlar_soni = izohlar_soni - 1 WHERE id = OLD.vazifa_id;
  ELSIF NEW.vazifa_id <> OLD.vazifa_id THEN  -- izoh boshqa vazifaga ko'chirildi
    UPDATE vazifalar SET izohlar_soni = izohlar_soni - 1 WHERE id = OLD.vazifa_id;
    UPDATE vazifalar SET izohlar_soni = izohlar_soni + 1 WHERE id = NEW.vazifa_id;
  END IF;
  RETURN NULL;  -- AFTER trigger: qaytgan qiymat e'tiborga olinmaydi
END $$;

CREATE TRIGGER izohlar_soni_trg
AFTER INSERT OR DELETE OR UPDATE OF vazifa_id ON izohlar
FOR EACH ROW EXECUTE FUNCTION izohlar_sonini_yangila();

-- Teglar sinxroni: vazifa qo'shilganda yoki matni o'zgarganda
CREATE FUNCTION vazifa_teglarini_yangila() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO teglar (egasi_id, nom)
  SELECT NEW.egasi_id, t.nom FROM teglarni_ajrat(NEW.matn) AS t(nom)
  ON CONFLICT (egasi_id, nom) DO NOTHING;

  DELETE FROM vazifa_teglari vt
  WHERE vt.vazifa_id = NEW.id
    AND vt.teg_id NOT IN (SELECT tg.id FROM teglar tg JOIN teglarni_ajrat(NEW.matn) AS t(nom)
                          ON tg.egasi_id = NEW.egasi_id AND tg.nom = t.nom);

  INSERT INTO vazifa_teglari (vazifa_id, teg_id)
  SELECT NEW.id, tg.id FROM teglar tg JOIN teglarni_ajrat(NEW.matn) AS t(nom)
    ON tg.egasi_id = NEW.egasi_id AND tg.nom = t.nom
  ON CONFLICT DO NOTHING;
  RETURN NULL;
END $$;

-- UPDATE OF matn: trigger faqat SET ro'yxatida matn bo'lsa ishlaydi (bajarildi o'zgarsa — yo'q)
CREATE TRIGGER vazifa_teglari_trg
AFTER INSERT OR UPDATE OF matn ON vazifalar
FOR EACH ROW EXECUTE FUNCTION vazifa_teglarini_yangila();
