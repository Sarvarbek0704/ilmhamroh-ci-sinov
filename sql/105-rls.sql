-- 105-rls.sql — 27-qism #09 (DB-70, holat 09): Row Level Security — har foydalanuvchi faqat o'z ma'lumotini ko'radi, BAZA darajasida.
-- Ilova `WHERE egasi_id = $1` ni unutsa ham boshqa odamning vazifasi chiqmaydi (ikkinchi himoya qatlami).
-- Ilova har tranzaksiyada: BEGIN; SET LOCAL ilova.foydalanuvchi_id = '<id>'; … COMMIT;  (SET emas — pool'da keyingi mijozga o'tadi; t09 o'lchovi).
-- Superuser va jadval egasi (postgres, migratsiya) RLS'ni chetlab o'tadi — siyosatlar faqat `vazifalar_ilova` roli orqali ishlaydi.
-- Rollar klaster darajasida (baza o'chirilsa ham qoladi) — shuning uchun IF NOT EXISTS.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vazifalar_ilova') THEN
    CREATE ROLE vazifalar_ilova NOLOGIN;
  END IF;
END $$;

-- Joriy foydalanuvchi: o'rnatilmagan YOKI bo'sh satr → NULL (hech narsa ko'rinmaydi — "yopiq holatda xavfsiz").
-- Bo'sh satr tuzog'i: SET LOCAL tugagach sessiyada '' qoladi, ''::bigint → xato (natijalar/09-rls.txt).
CREATE FUNCTION joriy_foydalanuvchi() RETURNS bigint
LANGUAGE sql STABLE PARALLEL SAFE
RETURN nullif(current_setting('ilova.foydalanuvchi_id', true), '')::bigint;

GRANT USAGE ON SCHEMA public TO vazifalar_ilova;
GRANT SELECT, INSERT, UPDATE, DELETE ON foydalanuvchilar, vazifalar, teglar, vazifa_teglari, izohlar TO vazifalar_ilova;
GRANT INSERT ON vazifa_tarixi TO vazifalar_ilova;        -- tarix trigger'i yozadi, ilova o'qimaydi
GRANT SELECT ON faol_vazifalar, foydalanuvchi_statistikasi TO vazifalar_ilova;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO vazifalar_ilova;

ALTER TABLE foydalanuvchilar ENABLE ROW LEVEL SECURITY;
ALTER TABLE vazifalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE teglar ENABLE ROW LEVEL SECURITY;
ALTER TABLE vazifa_teglari ENABLE ROW LEVEL SECURITY;
ALTER TABLE izohlar ENABLE ROW LEVEL SECURITY;

CREATE POLICY foydalanuvchilar_ozi ON foydalanuvchilar TO vazifalar_ilova
  USING (id = joriy_foydalanuvchi());
CREATE POLICY vazifalar_egasi ON vazifalar TO vazifalar_ilova
  USING (egasi_id = joriy_foydalanuvchi())
  WITH CHECK (egasi_id = joriy_foydalanuvchi());          -- boshqa odam nomiga yozib/ko'chirib bo'lmaydi
CREATE POLICY teglar_egasi ON teglar TO vazifalar_ilova
  USING (egasi_id = joriy_foydalanuvchi()) WITH CHECK (egasi_id = joriy_foydalanuvchi());
-- Bog'lanish va izohlar — vazifa orqali (EXISTS ichidagi vazifalar ham RLS bilan filtrlanadi)
CREATE POLICY vazifa_teglari_egasi ON vazifa_teglari TO vazifalar_ilova
  USING (EXISTS (SELECT 1 FROM vazifalar v WHERE v.id = vazifa_id));
CREATE POLICY izohlar_vazifa_egasi ON izohlar TO vazifalar_ilova
  USING (EXISTS (SELECT 1 FROM vazifalar v WHERE v.id = vazifa_id))
  WITH CHECK (EXISTS (SELECT 1 FROM vazifalar v WHERE v.id = vazifa_id) AND muallif_id = joriy_foydalanuvchi());

COMMENT ON FUNCTION joriy_foydalanuvchi() IS 'SET LOCAL ilova.foydalanuvchi_id dan; o''rnatilmagan/bo''sh → NULL (RLS hech narsa ko''rsatmaydi)';
