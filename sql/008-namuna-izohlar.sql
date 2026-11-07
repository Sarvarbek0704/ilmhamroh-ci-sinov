-- 008-namuna-izohlar.sql — #34: namuna izohlar (muallif — vazifa egasi).
INSERT INTO izohlar (vazifa_id, muallif_id, matn, yaratilgan_vaqt)
SELECT v.id, v.egasi_id, i.matn, i.vaqt::timestamptz
FROM (VALUES
  ('JavaScript kursining 26-qismini boshlash #o''qish', 'Docker darslaridan boshladim',                      '2026-10-01 20:00+05'),
  ('JavaScript kursining 26-qismini boshlash #o''qish', 'psql buyruqlari esda qolmayapti — \? yordam beradi','2026-10-04 21:15+05'),
  ('JavaScript kursining 26-qismini boshlash #o''qish', 'JOIN tushunarli bo''ldi',                           '2026-10-14 22:40+05'),
  ('Postgres''ni Docker''da ko''tarish #o''qish #docker', 'Port 5432 band ekan, 5499 ga o''tdim',             '2026-10-01 10:30+05'),
  ('Oshxonadagi jo''mrakni almashtirish #ta''mir #uy',  'Usta 250 000 so''m dedi, o''zim qilaman',          '2026-10-08 19:00+05'),
  ('Oshxonadagi jo''mrakni almashtirish #ta''mir #uy',  'Qistirma (prokladka) kerak ekan',                  '2026-10-12 18:20+05'),
  ('IELTS writing task 2 mashqi #ingliz',               'Opinion essay — 2 ta variant yozdim',              '2026-10-06 21:00+05'),
  ('Mashinani texnik ko''rikka olib borish #mashina',   'Navbat 15-oktabrga',                               '2026-10-04 09:00+05'),
  ('Mashinani texnik ko''rikka olib borish #mashina',   'Navbat ko''chdi, yangi sana noma''lum',           '2026-10-15 08:00+05'),
  ('Soliq hisobotini topshirish #ish #to''lov',         'Buxgalter bilan gaplashish kerak',                 '2026-10-13 12:00+05'),
  ('Kurs ishi: ma''lumotlar bazasi bo''limi #o''qish',  'Ilmiy rahbar 3NF gacha yetarli dedi',             '2026-10-05 16:00+05'),
  ('Server zaxirasini tekshirish #ish #server',         'Zaxira 03:00 da ishlaydi, lekin tiklash sinalmagan','2026-10-02 10:00+05'),
  ('Server zaxirasini tekshirish #ish #server',         'Tiklashni sinov serverida qilish kerak',           '2026-10-02 10:05+05'),
  ('Buyurtmalarni Telegram''da qabul qilish #ish',      'Bot orqali qilsa bo''lar ekan',                    '2026-10-04 08:00+05'),
  ('Universitet kontrakti #to''lov',                    'Birinchi yarmi to''landi',                         '2026-10-07 11:00+05')
) AS i(vazifa_matn, matn, vaqt)
JOIN vazifalar v ON v.matn = i.vazifa_matn
ORDER BY i.vaqt;
