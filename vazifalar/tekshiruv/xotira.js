// tekshiruv/xotira.js — Node'da localStorage o'rinbosari
// Boshqa importlardan OLDIN import qilinadi:
// modul birinchi bajariladi
class XotiraOmbori {
  #yozuvlar = new Map();

  getItem(kalit) {
    return this.#yozuvlar.get(String(kalit)) ?? null;
  }

  setItem(kalit, qiymat) {
    this.#yozuvlar.set(String(kalit), String(qiymat));
  }

  removeItem(kalit) {
    this.#yozuvlar.delete(String(kalit));
  }

  clear() {
    this.#yozuvlar.clear();
  }
}

globalThis.localStorage ??= new XotiraOmbori();
