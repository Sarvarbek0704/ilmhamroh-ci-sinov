# Oltin ssenariy — vazifalar v6

Avval `npm run build`, keyin `npm run preview` va ko'rsatilgan
manzilni oching (manba — `src/*.ts`, brauzer faqat `dist/` dagi
yig'ilgan `.js` ni o'qiydi).
Har qadamdan keyin Console toza (qizil xato yo'q). 1–14 — v2 dan,
xulq o'zgarmagan. v5 (TypeScript) va v6 (Vite) xulqni o'zgartirmagan.

| # | Harakat | Kutilgan natija |
|---|---|---|
| 1 | Sahifani ochish | uchta boshlang'ich vazifa; "2 ta vazifa qoldi, 1 ta bajarildi" |
| 2 | Bo'sh maydonda `Enter` | "Vazifa matnini yozing.", fokus maydonda |
| 3 | "non OLISH" qo'shish | "Bu vazifa ro'yxatda allaqachon bor." |
| 4 | "Sabzi olish #bozor #uy" | faollar oxirida; "Teglar: #bozor — 1, #uy — 1" |
| 5 | "Non olish" katagi | pastga tushadi, fokus o'z katagida |
| 6 | «Tahrirlash» → matn → `Enter` | "O'zgarish saqlandi.", fokus «Tahrirlash» da |
| 7 | «Tahrirlash» → `Esc` | matn eskicha, fokus «Tahrirlash» da |
| 8 | «Faol» da belgilash | vazifa chiqadi, fokus qo'shni katakda |
| 9 | «Bajarilgan» da qo'shish | filtr «Hammasi» ga o'tadi |
| 10 | «O'chirish» → dialogda «O'chirish» | "«…» o'chirildi.", fokus qo'shni «O'chirish» da (v4: avval tasdiq oynasi) |
| 11 | «JSON qilib chiqarish» | `"versiya": 1` li matn, to'liq belgilangan |
| 12 | O'z eksportini import | "N ta vazifa import qilindi." |
| 13 | `{"versiya": 2, ...}` import | "Versiya 2 o'qilmaydi — faqat 1.", ro'yxat o'zgarmaydi |
| 14 | Hammasini o'chirish | "Hozircha vazifa yo'q…", fokus "Ro'yxat" sarlavhasida |

v3 qadamlari (DevTools: Network va Application panellari):

| # | Harakat | Kutilgan natija |
|---|---|---|
| 15 | Birinchi ochilish | `GET` → `versiya: 0` → `PUT`; Application'da `vazifalar:kalit` |
| 16 | Qo'shish, belgilash, tahrir, o'chirish | har biri: `POST`/`PATCH`/`DELETE`, keyin `GET` |
| 17 | `F5` (Network: Slow 4G) | ro'yxat darhol keshdan, "Server bilan solishtirilmoqda…", keyin bo'sh |
| 18 | Ikkinchi tab, unda qo'shish | birinchi tabda ham darhol paydo bo'ladi |
| 19 | 1-tabda tahrir ochiq, 2-tabda qo'shish | 1-tabdagi yozilayotgan matn va fokus joyida |
| 20 | «Faol» → «Bajarilgan» → «Orqaga» | manzil `?filtr=faol`, «Faol» bosilgan |
| 21 | `?muvaffaqiyatsiz=1`: katakni bosish | darhol belgilanadi, so'ng qaytadi; "Saqlanmadi: Sinov uchun ataylab xato" |
| 22 | `?muvaffaqiyatsiz=1`: o'chirish va qo'shish | vazifa yo'qolib qaytadi; yangisi paydo bo'lib yo'qoladi |
| 23 | Network: Offline | "Internet yo'q. Ro'yxat — shu brauzerdagi nusxa." |
| 24 | Oflaynda katakni bosish | katak o'zgarmaydi; "Internet yo'q — o'zgarish saqlanmaydi." |
| 25 | Network: No throttling | xabar yo'qoladi, `GET` ketadi |
| 26 | Network: Slow 4G, `F5` va darhol katak | birinchi `GET` — `(canceled)`, belgilash saqlanadi |

v4 qadamlari (13-qism):

| # | Harakat | Kutilgan natija |
|---|---|---|
| 27 | Maydonga yozib, darhol `F5` | yozilgan matn joyida (qoralama) |
| 28 | Tema: «Qorong'i», `F5` | qorong'i, oq "chaqnash" yo'q; DevTools → Rendering → `prefers-color-scheme` o'zgartirilsa «Tizim» da tema ergashadi |
| 29 | «O'chirish» → `Esc` | dialog yopiladi, vazifa joyida, fokus «O'chirish» da; `Tab` dialogdan chiqmaydi |
| 30 | «Faylga yuklab olish» | `vazifalar-YYYY-MM-DD.json` yuklanadi |
| 31 | Shu faylni tanlash yoki Import qismiga sudrab tashlash | "N ta vazifa import qilindi." |
| 32 | Application → Service workers | `sw.js` — activated; Cache storage: `vazifalar-qobiq-v7-…` (VERSIYA — build yozadi, fayllar tarkibidan) |
| 33 | Network: Offline, `F5` | sahifa ochiladi (Service Worker), "Internet yo'q…" |
| 34 | Manzil satrida "O'rnatish" belgisi | ilova o'rnatiladi, alohida oynada ochiladi |
| 35 | Vazifa: `<img src=x onerror=alert(1)>` | matn sifatida ko'rinadi, alert yo'q |
| 36 | Console | CSP yoki Trusted Types xatosi yo'q; `[Web Vitals] …` qatorlari |

v4.1 qadamlari (14-qism):

| # | Harakat | Kutilgan natija |
|---|---|---|
| 37 | Qidiruvga `O‘QUV` (boshqa apostrof bilan) | `o'quv` va `oʻquv` yozilgan vazifalar; moslik sariq fonda; "N ta topildi" |
| 38 | Qidiruvda `Esc` | maydon bo'shaydi, hamma vazifa qaytadi |
| 39 | Tartib: «Alifbo bo'yicha», keyin «Faol», «Orqaga» | manzil `?saralash=alifbo&filtr=faol` → `?saralash=alifbo`; tanlov joyida; bajarilganlar baribir pastda |
| 40 | Yangi vazifa maydoniga `Non #b` | mavjud teglardan takliflar (ko'p ishlatilgani oldin); `↓`, `Enter` — teg qo'yiladi, fokus maydonda |
| 41 | Taklif ochiq, `Esc` | takliflar yopiladi, yozilgan matn joyida |
