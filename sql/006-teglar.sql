-- 006-teglar.sql — #23 (DB-20): teglar alohida jadvalda (N:M, #34). Manba — vazifa matnidagi #teg
-- (frontend shunday ishlaydi, 22-qism royxat.ts TEG). Teglar har foydalanuvchiniki: Azizning #uy i — Dilnozaniki emas.

CREATE TABLE teglar (
  id       bigint GENERATED ALWAYS AS IDENTITY,
  egasi_id bigint NOT NULL,
  nom      text   NOT NULL,
  CONSTRAINT teglar_pkey PRIMARY KEY (id),
  CONSTRAINT teglar_egasi_id_fkey FOREIGN KEY (egasi_id) REFERENCES foydalanuvchilar (id) ON DELETE CASCADE,
  -- teg kichik harfda saqlanadi (frontend ham toLowerCase qiladi), # bilan boshlanadi
  CONSTRAINT teglar_nom_check CHECK (nom ~ '^#' AND nom = lower(nom) AND char_length(nom) <= 50),
  -- ON CONFLICT (egasi_id, nom) shu cheklovga tayanadi
  CONSTRAINT teglar_egasi_id_nom_key UNIQUE (egasi_id, nom)
);

-- Bog'lovchi (junction) jadval: tarkibiy PRIMARY KEY — bir teg bir vazifaga ikki marta ulanmaydi
CREATE TABLE vazifa_teglari (
  vazifa_id bigint NOT NULL,
  teg_id    bigint NOT NULL,
  CONSTRAINT vazifa_teglari_pkey PRIMARY KEY (vazifa_id, teg_id),
  CONSTRAINT vazifa_teglari_vazifa_id_fkey FOREIGN KEY (vazifa_id) REFERENCES vazifalar (id) ON DELETE CASCADE,
  CONSTRAINT vazifa_teglari_teg_id_fkey FOREIGN KEY (teg_id) REFERENCES teglar (id) ON DELETE CASCADE
);
-- PK (vazifa_id, teg_id) "vazifaning teglari"ni topadi; "tegning vazifalari" uchun teskari indeks
CREATE INDEX vazifa_teglari_teg_id_idx ON vazifa_teglari (teg_id);

-- Matndan teglarni ajratish — frontend regex'ining Postgres (ARE) nusxasi: oldida harf/raqam/_/# bo'lmasin,
-- # dan keyin harf/raqam/_, ichida apostrof (' ‘ ’) faqat harflar orasida. [[:alnum:]] — bazaning lokali
-- bo'yicha (en_US.utf8: kirill va o'zbek harflari ham harf). IMMUTABLE — bir xil matnga doim bir xil natija
CREATE FUNCTION teglarni_ajrat(matn text) RETURNS SETOF text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT DISTINCT lower(m[1])
  FROM regexp_matches(matn, '(?<![[:alnum:]_#])(#[[:alnum:]_]+(?:[''‘’][[:alnum:]_]+)*)', 'g') AS m
$$;

-- Mavjud vazifalardan teglar: UPSERT — bor teg qayta qo'shilmaydi (ON CONFLICT DO NOTHING)
INSERT INTO teglar (egasi_id, nom)
SELECT DISTINCT v.egasi_id, t.nom
FROM vazifalar v CROSS JOIN LATERAL teglarni_ajrat(v.matn) AS t(nom)
ORDER BY 1, 2
ON CONFLICT (egasi_id, nom) DO NOTHING;

INSERT INTO vazifa_teglari (vazifa_id, teg_id)
SELECT v.id, tg.id
FROM vazifalar v
CROSS JOIN LATERAL teglarni_ajrat(v.matn) AS t(nom)
JOIN teglar tg ON tg.egasi_id = v.egasi_id AND tg.nom = t.nom
ON CONFLICT DO NOTHING;
