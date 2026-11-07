-- 012-namuna-yakuniy.sql — #40: trigger'lar ishlaganini ko'rsatadigan namuna amallar (tarix, Savat, versiya).
-- Vaqt ustunlari bu yerda now() dan (trigger) — har qurishda boshqacha; qolgan namuna ma'lumot qat'iy.
SET LOCAL ilova.foydalanuvchi_id = '1';   -- "kim" — Aziz (B bosqichda ilova har tranzaksiyada shunday qiladi)

UPDATE vazifalar SET bajarildi = true, bajarilgan_vaqt = now()
WHERE matn = 'SQL JOIN mashqlarini yechish #o''qish';

UPDATE vazifalar SET matn = 'Velosiped zanjirini moylash #ta''mir'   -- teg qo'shildi: trigger teglarni yangilaydi
WHERE matn = 'Velosiped zanjirini moylash';

UPDATE vazifalar SET ochirilgan_vaqt = now()                          -- Savatga
WHERE matn = 'Bozordan kartoshka va piyoz olish #bozor';

INSERT INTO vazifalar (egasi_id, matn)
SELECT id, 'Bozordan kartoshka va piyoz olish #bozor' FROM foydalanuvchilar WHERE email = 'aziz@example.com';
