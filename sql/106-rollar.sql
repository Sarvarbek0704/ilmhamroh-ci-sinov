-- 106-rollar.sql — 27-qism #11 (DB-72, holat 11): rollar va huquqlar — eng kam huquq tamoyili.
--   vazifalar_migratsiya — sxemani o'zgartiradi (DDL), jadvallar egasi bo'la oladi; ilova u bilan ISHLAMAYDI
--   vazifalar_ilova      — guruh (NOLOGIN, 105): faqat DML, RLS ostida
--   vazifalar_api        — LOGIN, vazifalar_ilova a'zosi (API jarayoni shu bilan ulanadi)
--   vazifalar_hisobot    — LOGIN, faqat o'qish (analitika, BI). RLS'ni chetlab o'tishi kerak — BYPASSRLS (ongli qaror, izohda)
-- Parollar: lokal kanon konteyneri trust (parolsiz). Serverda: CREATE ROLE … PASSWORD '…' (scram-sha-256) — sir .env da, bu faylda EMAS.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vazifalar_migratsiya') THEN CREATE ROLE vazifalar_migratsiya LOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vazifalar_api') THEN CREATE ROLE vazifalar_api LOGIN IN ROLE vazifalar_ilova; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vazifalar_hisobot') THEN CREATE ROLE vazifalar_hisobot LOGIN BYPASSRLS; END IF;
END $$;
-- Ulanish limiti: bitta rol butun max_connections'ni egallab olmasin
ALTER ROLE vazifalar_api CONNECTION LIMIT 40;
ALTER ROLE vazifalar_hisobot CONNECTION LIMIT 5;
-- Hisobot roli: uzun so'rov ilovani to'xtatmasin
ALTER ROLE vazifalar_hisobot SET statement_timeout = '30s';
ALTER ROLE vazifalar_hisobot SET default_transaction_read_only = on;

-- Bazaga ulanish: PUBLIC dan olib, aniq rollarga
-- baza nomi qat'iy yozilmaydi (holat boshqa nom bilan qurilishi mumkin — tekshir.sh "tekshiruv" bazasi)
DO $$ BEGIN
  EXECUTE format('REVOKE CONNECT, TEMPORARY ON DATABASE %I FROM PUBLIC', current_database());
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO vazifalar_migratsiya, vazifalar_api, vazifalar_hisobot', current_database());
END $$;

-- Sxema: PG 15+ da public sxemaga CREATE PUBLIC'da yo'q (eski versiyalarda bor edi — aniq yozamiz)
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO vazifalar_migratsiya;
GRANT USAGE ON SCHEMA public TO vazifalar_hisobot;

-- Hisobot: hamma jadval va view'ni o'qish (yozish yo'q)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO vazifalar_hisobot;

-- Kelajakdagi jadvallar (migratsiyani bajarayotgan rol — CURRENT_USER — yoki migratsiya roli yaratganda) huquqlarni o'zi oladi.
-- KANON XATOSI TUZATILDI (27 holat 65, Testcontainers topdi): avval "FOR ROLE postgres" edi — superuser boshqa nomli serverda (Testcontainers
-- "test", managed DB) migratsiya `role "postgres" does not exist` bilan yiqilardi.
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vazifalar_ilova;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public GRANT USAGE ON SEQUENCES TO vazifalar_ilova;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public GRANT SELECT ON TABLES TO vazifalar_hisobot;
ALTER DEFAULT PRIVILEGES FOR ROLE vazifalar_migratsiya IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vazifalar_ilova;
ALTER DEFAULT PRIVILEGES FOR ROLE vazifalar_migratsiya IN SCHEMA public GRANT USAGE ON SEQUENCES TO vazifalar_ilova;
ALTER DEFAULT PRIVILEGES FOR ROLE vazifalar_migratsiya IN SCHEMA public GRANT SELECT ON TABLES TO vazifalar_hisobot;

-- Funksiyalar: PUBLIC'da EXECUTE sukut bo'yicha bor — qoldiramiz (trigger funksiyalari, uz_normal, joriy_foydalanuvchi kerak)
