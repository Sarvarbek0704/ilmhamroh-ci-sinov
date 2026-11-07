-- 103-statistika-mv.sql — 27-qism #04 (DB-65, holat 04): foydalanuvchi statistikasi — MATERIALIZED VIEW.
-- "Statistika" sahifasi (frontend 21-qism analitika) har so'rovda butun jadvalni agregatlamasin: natija saqlanadi, fon ishida
-- REFRESH ... CONCURRENTLY bilan yangilanadi (o'qishni to'smaydi; buning uchun UNIQUE indeks SHART). Ma'lumot biroz eskirgan bo'lishi
-- mumkin — `yangilangan` ustuni buni ochiq ko'rsatadi.

CREATE MATERIALIZED VIEW foydalanuvchi_statistikasi AS
SELECT f.id AS foydalanuvchi_id,
       count(v.id) AS jami,
       count(v.id) FILTER (WHERE v.bajarildi) AS bajarilgan,
       count(v.id) FILTER (WHERE NOT v.bajarildi AND v.muddat < now()) AS muddati_otgan,
       round(100.0 * count(v.id) FILTER (WHERE v.bajarildi) / nullif(count(v.id), 0), 1) AS bajarilgan_foiz,
       avg(v.bajarilgan_vaqt - v.yaratilgan_vaqt) FILTER (WHERE v.bajarildi) AS ortacha_bajarish,
       max(v.yaratilgan_vaqt) AS oxirgi_vazifa,
       now() AS yangilangan
FROM foydalanuvchilar f
LEFT JOIN vazifalar v ON v.egasi_id = f.id AND v.ochirilgan_vaqt IS NULL
GROUP BY f.id;

CREATE UNIQUE INDEX foydalanuvchi_statistikasi_pkey ON foydalanuvchi_statistikasi (foydalanuvchi_id);

COMMENT ON MATERIALIZED VIEW foydalanuvchi_statistikasi IS
  'Statistika sahifasi; REFRESH MATERIALIZED VIEW CONCURRENTLY bilan yangilanadi (fon ishi), yangilangan — oxirgi yangilanish vaqti';
