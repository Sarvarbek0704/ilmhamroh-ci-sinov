-- 003-namuna-asosiy.sql — #15 (DB-12): namuna ma'lumot (seed). Fayl nomida "-namuna-" — prod'da qo'llanmaydi
-- (qur.sh --namunasiz). Vaqtlar qat'iy (now() emas) — darsdagi chiqishlar har safar bir xil bo'lsin.
-- Ismlar o'ylab topilgan; email — example.com (STANDART K4.1).

INSERT INTO foydalanuvchilar (email, ism, yaratilgan_vaqt) VALUES
  ('aziz@example.com',     'Aziz Karimov',      '2026-09-01 09:00+05'),
  ('dilnoza@example.com',  'Dilnoza Rahimova',  '2026-09-03 14:20+05'),
  ('sardor@example.com',   'Sardor Tursunov',   '2026-09-10 20:45+05'),
  ('madina@example.com',   'Madina Yusupova',   '2026-09-15 08:10+05'),
  ('javohir@example.com',  'Javohir Olimov',    '2026-09-21 11:30+05'),
  ('gulnora@example.com',  'Gulnora Saidova',   '2026-10-01 16:05+05'),
  ('bekzod@example.com',   'Bekzod Nazarov',    '2026-10-05 22:15+05'),
  ('shahnoza@example.com', 'Shahnoza Ergasheva','2026-10-12 10:00+05');  -- hali vazifasi yo'q (LEFT JOIN, #24)

-- INSERT ... SELECT: id'lar qo'lda yozilmaydi — email bo'yicha topiladi
INSERT INTO vazifalar (egasi_id, matn, bajarildi, yaratilgan_vaqt)
SELECT f.id, v.matn, v.bajarildi, v.vaqt::timestamptz
FROM (VALUES
  ('aziz@example.com',    'JavaScript kursining 26-qismini boshlash #o''qish',            false, '2026-10-01 08:30+05'),
  ('aziz@example.com',    'Postgres''ni Docker''da ko''tarish #o''qish #docker',          true,  '2026-10-01 09:10+05'),
  ('aziz@example.com',    'Bozordan kartoshka va piyoz olish #bozor',                     true,  '2026-10-02 18:40+05'),
  ('aziz@example.com',    'Onamga dori olib borish #oila',                                true,  '2026-10-03 07:55+05'),
  ('aziz@example.com',    'Portfolio saytiga blog yozish #portfolio',                     false, '2026-10-05 21:00+05'),
  ('aziz@example.com',    'Oshxonadagi jo''mrakni almashtirish #ta''mir #uy',             false, '2026-10-07 10:15+05'),
  ('aziz@example.com',    'Elektr to''lovini Click orqali qilish #to''lov',               true,  '2026-10-10 12:00+05'),
  ('aziz@example.com',    'SQL JOIN mashqlarini yechish #o''qish',                        false, '2026-10-14 19:30+05'),
  ('aziz@example.com',    'Velosiped zanjirini moylash',                                  false, '2026-10-18 17:20+05'),
  ('dilnoza@example.com', 'Ingliz tili: 20 ta yangi so''z #o''qish #ingliz',              true,  '2026-10-02 07:00+05'),
  ('dilnoza@example.com', 'IELTS writing task 2 mashqi #ingliz',                          false, '2026-10-04 20:10+05'),
  ('dilnoza@example.com', 'Bozordan meva olish #bozor',                                   true,  '2026-10-05 17:45+05'),
  ('dilnoza@example.com', 'Dugonamning tug''ilgan kuniga sovg''a #oila',                   false, '2026-10-09 13:00+05'),
  ('dilnoza@example.com', 'Gaz to''lovi #to''lov',                                        true,  '2026-10-11 09:30+05'),
  ('dilnoza@example.com', 'Rezyume yangilash #ish',                                       false, '2026-10-16 22:00+05'),
  ('sardor@example.com',  'Mashinani texnik ko''rikka olib borish #mashina',              false, '2026-10-03 08:00+05'),
  ('sardor@example.com',  'Moy almashtirish #mashina',                                    true,  '2026-10-03 08:05+05'),
  ('sardor@example.com',  'Hovlidagi daraxtlarni oqlash #uy',                             true,  '2026-10-06 16:30+05'),
  ('sardor@example.com',  'Do''konga yangi narxlarni kiritish #ish',                      false, '2026-10-08 10:45+05'),
  ('sardor@example.com',  'Soliq hisobotini topshirish #ish #to''lov',                     false, '2026-10-13 11:00+05'),
  ('sardor@example.com',  'Futbol: payshanba 20:00 #sport',                               true,  '2026-10-15 19:00+05'),
  ('madina@example.com',  'Kurs ishi: ma''lumotlar bazasi bo''limi #o''qish',              false, '2026-10-02 15:00+05'),
  ('madina@example.com',  'Kutubxonaga kitob qaytarish #o''qish',                         true,  '2026-10-04 10:20+05'),
  ('madina@example.com',  'Yotoqxona to''lovi #to''lov',                                  true,  '2026-10-06 09:00+05'),
  ('madina@example.com',  'Python laboratoriya ishi #o''qish',                            false, '2026-10-12 23:40+05'),
  ('madina@example.com',  'Uyga qo''ng''iroq qilish #oila',                               true,  '2026-10-17 21:10+05'),
  ('javohir@example.com', 'Mijozga taklifnoma yuborish #ish',                             true,  '2026-10-01 10:00+05'),
  ('javohir@example.com', 'Server zaxirasini tekshirish #ish #server',                    false, '2026-10-02 09:15+05'),
  ('javohir@example.com', 'Nginx sertifikatini yangilash #server',                        true,  '2026-10-05 08:30+05'),
  ('javohir@example.com', 'Jamoa bilan haftalik yig''ilish #ish',                         true,  '2026-10-06 11:00+05'),
  ('javohir@example.com', 'Yangi xodimga kirish huquqi berish #ish #server',              false, '2026-10-09 14:00+05'),
  ('javohir@example.com', 'Sport zalga yozilish #sport',                                  false, '2026-10-19 07:30+05'),
  ('gulnora@example.com', 'Somsa uchun xamir tayyorlash #oshxona',                        true,  '2026-10-02 06:30+05'),
  ('gulnora@example.com', 'Buyurtmalarni Telegram''da qabul qilish #ish',                 false, '2026-10-03 09:00+05'),
  ('gulnora@example.com', 'Un va yog'' xarid qilish #bozor #oshxona',                     true,  '2026-10-07 07:15+05'),
  ('gulnora@example.com', 'Instagram uchun surat olish #ish',                             false, '2026-10-12 15:30+05'),
  ('bekzod@example.com',  'Universitet kontrakti #to''lov',                               false, '2026-10-06 10:00+05'),
  ('bekzod@example.com',  'Algoritmlar: 5 ta masala #o''qish',                            true,  '2026-10-08 20:00+05'),
  ('bekzod@example.com',  'Noutbukka SSD qo''yish #ta''mir',                              false, '2026-10-14 13:45+05'),
  ('bekzod@example.com',  'Do''stlar bilan choyxona #dam',                                true,  '2026-10-18 19:00+05')
) AS v(email, matn, bajarildi, vaqt)
JOIN foydalanuvchilar f ON f.email = v.email
ORDER BY v.vaqt;  -- id'lar vaqt tartibida berilsin
