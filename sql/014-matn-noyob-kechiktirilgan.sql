-- 014-matn-noyob-kechiktirilgan.sql — B bosqich (#53, holat 53): "faol vazifalar orasida takror matn yo'q" qoidasi endi buyruq OXIRIDA tekshiriladi.
-- Topilma (pg-ombor testi): PUT /v1/vazifalar (almashtirHammasi) ikki vazifaning matnini almashtirsa (id 2: "p1", id 5: "p2" → aksincha),
-- bitta UPDATE ... FROM unnest buyrug'i ichida ham UNIQUE INDEX har QATORDAN keyin tekshiriladi → 23505, garchi yakuniy holat to'g'ri bo'lsa ham.
-- Partial + ifoda indeksini DEFERRABLE qilib bo'lmaydi (faqat UNIQUE/PK/EXCLUDE cheklovlari). Yechim — teng ma'noli EXCLUDE cheklovi
-- (btree, = operatorlari — noyob indeks bilan bir xil), DEFERRABLE INITIALLY IMMEDIATE: tekshiruv buyruq oxirida; kerak bo'lsa
-- SET CONSTRAINTS ... DEFERRED bilan COMMIT'gacha. Xato kodi 23505 → 23P01 (ilova ikkalasini ham "takror" deb biladi).
DROP INDEX vazifalar_egasi_id_matn_key;
ALTER TABLE vazifalar ADD CONSTRAINT vazifalar_egasi_id_matn_excl
  EXCLUDE USING btree (egasi_id WITH =, lower(matn) WITH =) WHERE (ochirilgan_vaqt IS NULL)
  DEFERRABLE INITIALLY IMMEDIATE;
COMMENT ON CONSTRAINT vazifalar_egasi_id_matn_excl ON vazifalar IS 'Faol vazifalar orasida egasi bo''yicha registrga befarq noyob matn; buyruq oxirida tekshiriladi (PUT matnlarni almashtira oladi)';
