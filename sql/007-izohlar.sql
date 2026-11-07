-- 007-izohlar.sql — #34 (DB-31): 1:N — bitta vazifaning ko'p izohi. FK "ko'p" tomonda (izohlar.vazifa_id).
CREATE TABLE izohlar (
  id              bigint      GENERATED ALWAYS AS IDENTITY,
  vazifa_id       bigint      NOT NULL,
  -- muallif o'chirilsa izoh qoladi ("o'chirilgan foydalanuvchi") — SET NULL; hozir muallif = vazifa egasi,
  -- jamoaviy vazifalar — 38-qism capstone (`jamoa`)
  muallif_id      bigint,
  matn            text        NOT NULL,
  yaratilgan_vaqt timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT izohlar_pkey PRIMARY KEY (id),
  CONSTRAINT izohlar_vazifa_id_fkey FOREIGN KEY (vazifa_id) REFERENCES vazifalar (id) ON DELETE CASCADE,
  CONSTRAINT izohlar_muallif_id_fkey FOREIGN KEY (muallif_id) REFERENCES foydalanuvchilar (id) ON DELETE SET NULL,
  CONSTRAINT izohlar_matn_check CHECK (btrim(matn) <> '' AND char_length(matn) <= 2000)
);
-- "vazifaning izohlari, vaqt tartibida" — bitta indeks ham FK'ni, ham saralashni qoplaydi (#57)
CREATE INDEX izohlar_vazifa_id_yaratilgan_vaqt_idx ON izohlar (vazifa_id, yaratilgan_vaqt);
CREATE INDEX izohlar_muallif_id_idx ON izohlar (muallif_id);
