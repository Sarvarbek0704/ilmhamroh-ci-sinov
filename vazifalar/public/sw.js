// sw.js — Service Worker: sahifa va tarmoq orasidagi proksi.
// Sahifadan alohida thread'da ishlaydi: DOM, localStorage yo'q.

// VERSIYA va QOBIQ — build natijasi: skriptlar/qobiq.js (postbuild)
// dist/sw.js ga dist/ dagi hamma fayl nomini (hash bilan) va ularning
// tarkibidan olingan VERSIYA ni yozadi. Fayl o'zgarsa — VERSIYA ham,
// sw.js bayti o'zgaradi: brauzer yangi SW ni o'rnatadi, yangi kesh
const VERSIYA = "manba";
const KESH_OLDI = "vazifalar-qobiq-";
const KESH = KESH_OLDI + VERSIYA;

// Ilova qobig'i (app shell): sahifa internetsiz ochilishi uchun
// kerak bo'lgan hamma fayl. Yo'llar sw.js joylashgan papkaga nisbatan.
// Manbada — faqat sahifa; qolgani build'da qo'shiladi
const QOBIQ = ["./", "index.html"];

// 1. O'rnatish: qobiq keshga olinadi. waitUntil — Promise tugaguncha
// o'rnatish tugamaydi; bitta fayl ham yuklanmasa, o'rnatish bekor
// bo'ladi va eski versiya ishlashda davom etadi.
// 21/#28: skipWaiting YO'Q — yangi versiya "kutadi" (waiting), ochiq
// sahifa eski kod va eski kesh bilan ishlayveradi; foydalanuvchi
// «Yangilash» ni bossa — "yangila" xabari (pastda). Avval darhol
// faollashardi va eski keshni o'chirardi: ochiq sahifa kech chunk'ni
// so'raganda u serverda yo'q edi (o'lchandi: natijalar/28-sw-yangilanish-
// oldin.txt — "Failed to fetch dynamically imported module").
// Birinchi o'rnatishda kutish yo'q — boshqaradigan eski SW yo'q
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(KESH).then((kesh) => kesh.addAll(QOBIQ)));
});

// Sahifa «Yangilash» ni bosdi (sw-yangilanish.ts): kutish tugaydi,
// activate → clients.claim → sahifada controllerchange → qayta yuklash
self.addEventListener("message", (event) => {
  if (event.data === "yangila") {
    void self.skipWaiting();
  }
});

// 2. Faollashish: eski versiyalarning keshi o'chiriladi. Faqat
// o'zimiznikini: login.github.io dagi boshqa loyihalar ham shu
// origin'da, ularning keshiga tegmaymiz
async function eskiKeshlarniOchir() {
  const nomlar = await caches.keys();
  const eskilar = nomlar.filter(
    (nom) => nom.startsWith(KESH_OLDI) && nom !== KESH,
  );
  await Promise.all(eskilar.map((nom) => caches.delete(nom)));
}

self.addEventListener("activate", (event) => {
  // clients.claim — allaqachon ochiq sahifalar ham shu SW'ga o'tadi
  event.waitUntil(
    eskiKeshlarniOchir().then(() => self.clients.claim()),
  );
});

// 3. So'rovlar. Qaysi so'rovga qaysi strategiya:
// - API (boshqa origin) va yozuvlar (POST, PATCH...) — SW tegmaydi.
//   Ro'yxatning oflayn nusxasi allaqachon bor (localStorage), API
//   javobini ham keshlasak, server o'chganda eski ro'yxat "yangi"
//   bo'lib ko'rinardi va ilova "Serverga ulanib bo'lmadi" demasdi
// - ilova sahifasi (navigatsiya) va qobiq fayllari — network-first
function strategiya(sorov) {
  const url = new URL(sorov.url);
  if (sorov.method !== "GET" || url.origin !== self.location.origin) {
    return null;
  }
  if (sorov.mode === "navigate") {
    // 19/#02: ilova sahifalarga bo'lingan (React Router): /vazifalar/,
    // /vazifalar/vazifa/2, /vazifalar/statistika... — hammasi BITTA
    // index.html, sahifani brauzerdagi router tanlaydi. SW faqat o'z
    // papkasini (scope) ko'radi; kengaytmali fayl (README.md, .json) —
    // sahifa emas, aralashmaymiz (.html dan tashqari)
    const faylmi = /\.[a-z0-9]+$/i.test(url.pathname);
    const sahifami = !faylmi || url.pathname.endsWith(".html");
    return sahifami ? "sahifa" : null;
  }
  return "fayl";
}

// Network-first: avval tarmoq — yangi versiya darhol ko'rinadi (VERSIYA
// ni unutsak ham). Tarmoq bo'lmasa — kesh. Muvaffaqiyatli javob keshni
// yangilab boradi. Sahifa "?filtr=faol" bilan yoki /vazifa/2 dan
// ochilsa ham — bitta index.html nusxasi
async function tarmoqdanYokiKeshdan(event, tur) {
  const sorov = event.request;
  const kalit = tur === "sahifa" ? "index.html" : sorov;
  const kesh = await caches.open(KESH);
  try {
    const javob = await fetch(sorov);
    // 21/#28: fayl serverda yo'q (404) yoki SPA zaxirasi uning o'rniga
    // index.html berdi (Vercel rewrites — 200, lekin HTML) — eski
    // versiyaning fayli: keshda bo'lsa (har qanday versiya keshida) o'shani
    if (tur === "fayl" && yoqmi(sorov, javob)) {
      const eski = await caches.match(sorov);
      if (eski !== undefined) {
        return eski;
      }
      return javob;
    }
    if (javob.ok) {
      // Javobni kutib turmaymiz; waitUntil SW'ni yozish tugaguncha
      // tirik saqlaydi. clone — javob tanasini bir marta o'qish mumkin
      event.waitUntil(kesh.put(kalit, javob.clone()));
    }
    return javob;
  } catch (xato) {
    const nusxa = await kesh.match(kalit);
    if (nusxa !== undefined) {
      return nusxa;
    }
    throw xato; // keshda ham yo'q — brauzer odatdagi xatoni ko'rsatadi
  }
}

function yoqmi(sorov, javob) {
  if (!javob.ok) {
    return true;
  }
  const turi = javob.headers.get("Content-Type") ?? "";
  return sorov.destination === "script" && turi.includes("text/html");
}

self.addEventListener("fetch", (event) => {
  const tur = strategiya(event.request);
  if (tur === null) {
    return; // respondWith yo'q — so'rov odatdagidek tarmoqqa ketadi
  }
  event.respondWith(tarmoqdanYokiKeshdan(event, tur));
});
