-- 102-namuna-sozlamalar.sql — holat 01 namuna ma'lumoti: 8 foydalanuvchidan 6 tasida sozlama bor
UPDATE foydalanuvchilar SET sozlamalar = s.j::jsonb
FROM (VALUES
  ('aziz@example.com',     '{"til": "uz-Latn", "mavzu": "qorongi", "bildirishnoma": {"email": true, "telegram": true}}'),
  ('dilnoza@example.com',  '{"til": "uz-Cyrl", "mavzu": "yorug", "bildirishnoma": {"email": false}}'),
  ('madina@example.com',    '{"til": "ru", "mavzu": "tizim"}'),
  ('gulnora@example.com',  '{"til": "uz-Latn", "bildirishnoma": {"email": true, "telegram": false}}'),
  ('sardor@example.com',   '{"mavzu": "qorongi", "tajriba": {"yangi_royxat": true}}'),
  ('bekzod@example.com',    '{"til": "en", "mavzu": "qorongi", "bildirishnoma": {"email": true}}')
) AS s(email, j)
WHERE foydalanuvchilar.email = s.email;
