-- 005-namuna-muddat.sql — #21: namuna ma'lumotga muddat, ustuvorlik, aniq bajarilgan vaqt va kichik vazifalar.

-- Bajarilgan vaqt: yaratilgandan bir necha soat/kun keyin (window funksiyalar, #29 — "qancha vaqtda bajarildi")
UPDATE vazifalar AS v SET bajarilgan_vaqt = v.yaratilgan_vaqt + b.oraliq::interval
FROM (VALUES
  ('Postgres''ni Docker''da ko''tarish #o''qish #docker', '2 hours 15 minutes'),
  ('Bozordan kartoshka va piyoz olish #bozor',            '40 minutes'),
  ('Onamga dori olib borish #oila',                       '3 hours'),
  ('Elektr to''lovini Click orqali qilish #to''lov',      '5 minutes'),
  ('Ingliz tili: 20 ta yangi so''z #o''qish #ingliz',     '1 day 2 hours'),
  ('Bozordan meva olish #bozor',                          '1 hour'),
  ('Gaz to''lovi #to''lov',                               '2 days'),
  ('Moy almashtirish #mashina',                           '4 days 1 hour'),
  ('Hovlidagi daraxtlarni oqlash #uy',                    '1 day'),
  ('Futbol: payshanba 20:00 #sport',                      '1 hour 30 minutes'),
  ('Kutubxonaga kitob qaytarish #o''qish',                '6 hours'),
  ('Yotoqxona to''lovi #to''lov',                         '3 days 4 hours'),
  ('Uyga qo''ng''iroq qilish #oila',                      '10 minutes'),
  ('Mijozga taklifnoma yuborish #ish',                    '2 hours'),
  ('Nginx sertifikatini yangilash #server',               '30 minutes'),
  ('Jamoa bilan haftalik yig''ilish #ish',                '1 hour'),
  ('Somsa uchun xamir tayyorlash #oshxona',               '45 minutes'),
  ('Un va yog'' xarid qilish #bozor #oshxona',            '5 hours'),
  ('Algoritmlar: 5 ta masala #o''qish',                   '2 days 3 hours'),
  ('Do''stlar bilan choyxona #dam',                       '4 hours')
) AS b(matn, oraliq)
WHERE v.matn = b.matn;

-- Ustuvorlik va muddat (Toshkent vaqti, +05). Muddati o'tganlar ham bor (#22, #32)
UPDATE vazifalar AS v SET ustuvorlik = u.ustuvorlik::ustuvorlik, muddat = u.muddat::timestamptz
FROM (VALUES
  ('JavaScript kursining 26-qismini boshlash #o''qish', 'yuqori', '2026-10-31 23:59+05'),
  ('Portfolio saytiga blog yozish #portfolio',          'orta',   '2026-11-15 18:00+05'),
  ('Oshxonadagi jo''mrakni almashtirish #ta''mir #uy',  'yuqori', '2026-10-20 18:00+05'),
  ('Elektr to''lovini Click orqali qilish #to''lov',    'yuqori', '2026-10-10 23:59+05'),
  ('SQL JOIN mashqlarini yechish #o''qish',             'orta',   '2026-10-25 21:00+05'),
  ('Velosiped zanjirini moylash',                       'past',   NULL),
  ('IELTS writing task 2 mashqi #ingliz',               'yuqori', '2026-10-24 20:00+05'),
  ('Dugonamning tug''ilgan kuniga sovg''a #oila',       'orta',   '2026-10-26 12:00+05'),
  ('Rezyume yangilash #ish',                            'past',   NULL),
  ('Mashinani texnik ko''rikka olib borish #mashina',   'yuqori', '2026-10-15 17:00+05'),
  ('Do''konga yangi narxlarni kiritish #ish',           'orta',   '2026-10-09 09:00+05'),
  ('Soliq hisobotini topshirish #ish #to''lov',         'yuqori', '2026-10-25 18:00+05'),
  ('Kurs ishi: ma''lumotlar bazasi bo''limi #o''qish',  'yuqori', '2026-11-01 09:00+05'),
  ('Python laboratoriya ishi #o''qish',                 'orta',   '2026-10-22 08:30+05'),
  ('Server zaxirasini tekshirish #ish #server',         'yuqori', '2026-10-03 18:00+05'),
  ('Yangi xodimga kirish huquqi berish #ish #server',   'orta',   '2026-10-10 18:00+05'),
  ('Sport zalga yozilish #sport',                       'past',   NULL),
  ('Buyurtmalarni Telegram''da qabul qilish #ish',      'yuqori', NULL),
  ('Instagram uchun surat olish #ish',                  'past',   '2026-10-30 12:00+05'),
  ('Universitet kontrakti #to''lov',                    'yuqori', '2026-11-01 18:00+05'),
  ('Noutbukka SSD qo''yish #ta''mir',                   'orta',   NULL)
) AS u(matn, ustuvorlik, muddat)
WHERE v.matn = u.matn;

-- Kichik vazifalar (ota_id): ikki daraja — "Kurs ishi" → "Jadvallar" → "ER diagramma"
INSERT INTO vazifalar (egasi_id, matn, bajarildi, bajarilgan_vaqt, ota_id, yaratilgan_vaqt)
SELECT o.egasi_id, k.matn, k.bajarildi, k.bajarilgan::timestamptz, o.id, k.vaqt::timestamptz
FROM (VALUES
  ('Portfolio saytiga blog yozish #portfolio',         'Blog uchun mavzu tanlash',          true,  '2026-10-06 20:00+05', '2026-10-05 21:05+05'),
  ('Portfolio saytiga blog yozish #portfolio',         'Qoralama yozish',                   false, NULL,                  '2026-10-05 21:06+05'),
  ('Portfolio saytiga blog yozish #portfolio',         'Rasmlarni siqish',                  false, NULL,                  '2026-10-05 21:07+05'),
  ('Kurs ishi: ma''lumotlar bazasi bo''limi #o''qish', 'Jadvallarni loyihalash',            false, NULL,                  '2026-10-02 15:05+05'),
  ('Kurs ishi: ma''lumotlar bazasi bo''limi #o''qish', 'Adabiyotlar ro''yxati',             true,  '2026-10-07 18:00+05', '2026-10-02 15:06+05')
) AS k(ota_matn, matn, bajarildi, bajarilgan, vaqt)
JOIN vazifalar o ON o.matn = k.ota_matn
ORDER BY k.vaqt;

INSERT INTO vazifalar (egasi_id, matn, ota_id, yaratilgan_vaqt)
SELECT o.egasi_id, k.matn, o.id, k.vaqt::timestamptz
FROM (VALUES
  ('Jadvallarni loyihalash', 'ER diagramma chizish', '2026-10-03 10:00+05'),
  ('Jadvallarni loyihalash', 'Normalizatsiyani tekshirish', '2026-10-03 10:01+05')
) AS k(ota_matn, matn, vaqt)
JOIN vazifalar o ON o.matn = k.ota_matn
ORDER BY k.vaqt;
