// tekshiruv/sw-muhit.js — sw.js ni Node'da soxta muhitda ishga tushirish
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SW_MATNI = readFileSync(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);

// sw.js shu manzilda turibdi deb hisoblaymiz (GitHub Pages)
export const ILOVA = "https://login.github.io/vazifalar/";

const toliq = (sorov) =>
  new URL(typeof sorov === "string" ? sorov : sorov.url, ILOVA).href;

// Cache Storage o'rinbosari: nomlar → Map(to'liq URL → Response)
export function soxtaCaches(boshlangich = []) {
  const keshlar = new Map(boshlangich.map((nom) => [nom, new Map()]));
  return {
    keshlar,
    async open(nom) {
      if (!keshlar.has(nom)) keshlar.set(nom, new Map());
      const kesh = keshlar.get(nom);
      return {
        async addAll(yollar) {
          for (const yol of yollar) {
            kesh.set(toliq(yol), new Response(`kesh: ${yol}`));
          }
        },
        async put(sorov, javob) {
          kesh.set(toliq(sorov), javob);
        },
        async match(sorov) {
          return kesh.get(toliq(sorov));
        },
      };
    },
    async keys() {
      return [...keshlar.keys()];
    },
    // 21/#28: hamma keshdan qidirish (caches.match)
    async match(sorov) {
      for (const kesh of keshlar.values()) {
        const javob = kesh.get(toliq(sorov));
        if (javob !== undefined) return javob;
      }
      return undefined;
    },
    async delete(nom) {
      return keshlar.delete(nom);
    },
  };
}

// Brauzerdagi so'rovga o'xshash obyekt (Node'da Request.mode doim "cors")
export function sorov(
  yol,
  { method = "GET", mode = "cors", destination = "" } = {},
) {
  return { url: toliq(yol), method, mode, destination };
}

// sw.js ichidagi const'lar (VERSIYA, QOBIQ...) shu kontekstda qoladi
export function swniYukla({ caches = soxtaCaches(), fetch } = {}) {
  const tinglovchilar = {};
  const self = {
    addEventListener: (tur, fn) => (tinglovchilar[tur] = fn),
    skipWaiting: async () => (self.kutmadi = true),
    clients: { claim: async () => (self.egallandi = true) },
    location: new URL("sw.js", ILOVA),
  };
  const kontekst = vm.createContext({
    self,
    caches,
    fetch,
    Response,
    URL,
    console,
  });
  vm.runInContext(SW_MATNI, kontekst);
  const qiymat = (nom) => vm.runInContext(nom, kontekst);
  // Hodisani yuboradi; waitUntil va respondWith ga berilganini kutadi
  async function yubor(tur, maydonlar = {}) {
    const kutilganlar = [];
    let javob;
    tinglovchilar[tur]({
      ...maydonlar,
      waitUntil: (p) => kutilganlar.push(p),
      respondWith: (p) => (javob = p),
    });
    const natija = await javob;
    await Promise.all(kutilganlar);
    return { javobBormi: javob !== undefined, natija };
  }
  return { self, caches, qiymat, yubor, tinglovchilar };
}
