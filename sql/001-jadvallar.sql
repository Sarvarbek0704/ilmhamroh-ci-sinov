-- 001-jadvallar.sql — #12 (DB-09): birinchi ikki jadval va cheklovlar (constraint).
-- Nomlash (DB-37): jadval — ko'plikda, snake_case, lotin harflari apostrofsiz; cheklov nomi —
-- PostgreSQL'ning o'z andozasi: <jadval>_<ustun>_<pkey|key|fkey|check|idx>. Xato xabarida shu nom chiqadi.
-- Kalit: bigint GENERATED ALWAYS AS IDENTITY (#13 — tanlov va o'lchov).

CREATE TABLE foydalanuvchilar (
  id              bigint      GENERATED ALWAYS AS IDENTITY,
  email           text        NOT NULL,
  ism             text        NOT NULL,
  yaratilgan_vaqt timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT foydalanuvchilar_pkey PRIMARY KEY (id),
  -- to'liq email tekshiruvi — ilova ishi; baza faqat "@ bor, bo'shliq yo'q" ni kafolatlaydi
  CONSTRAINT foydalanuvchilar_email_check CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+$'),
  CONSTRAINT foydalanuvchilar_ism_check CHECK (btrim(ism) <> '' AND char_length(ism) <= 100)
);

-- Email registrga befarq noyob: Aziz@Example.com va aziz@example.com — bitta odam.
-- UNIQUE (email) buni tutmaydi, ifoda ustidagi noyob indeks tutadi
CREATE UNIQUE INDEX foydalanuvchilar_email_key ON foydalanuvchilar (lower(email));

CREATE TABLE vazifalar (
  id              bigint      GENERATED ALWAYS AS IDENTITY,
  egasi_id        bigint      NOT NULL,   -- FK — #14 (002-tashqi-kalitlar.sql)
  matn            text        NOT NULL,
  bajarildi       boolean     NOT NULL DEFAULT false,
  yaratilgan_vaqt timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vazifalar_pkey PRIMARY KEY (id),
  -- frontend qoidasi (22-qism, Vazifa.MAKS_UZUNLIK = 100): bo'sh emas, chetida bo'shliq yo'q, ≤ 100 belgi
  CONSTRAINT vazifalar_matn_check CHECK (matn = btrim(matn) AND char_length(matn) BETWEEN 1 AND 100)
);
