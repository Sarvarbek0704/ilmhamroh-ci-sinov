// profil-rasmi.ts — saqlangan rasm (19/#36, #27): IndexedDB'da (idb-keyval).
// Nega localStorage emas: u faqat MATN saqlaydi — rasm base64 bo'lib
// 33% kattalashadi va 5 MB chegaraning katta qismini oladi; IndexedDB
// Blob'ni o'zini saqlaydi. Ro'yxat esa localStorage'da qoladi: 10 000
// vazifada o'qish 1.7 ms (sinxron — birinchi kadrda kerak), idb-keyval
// 6.5 ms va faqat async (natijalar/tajriba/27-indexeddb.txt).
// Ekranga — obyekt URL (blob:...): CSP img-src 'self' blob:
import { useSyncExternalStore } from "react";
import { del, get, set } from "idb-keyval";

const KALIT = "vazifalar:profil-rasmi";

let joriyUrl: string | null = null;
let yuklandi = false;
const tinglovchilar = new Set<() => void>();

function almashtir(blob: Blob | undefined): void {
  if (joriyUrl !== null) {
    URL.revokeObjectURL(joriyUrl); // eski Blob xotiradan bo'shasin
  }
  joriyUrl = blob === undefined ? null : URL.createObjectURL(blob);
  tinglovchilar.forEach((t) => t());
}

function obuna(tinglovchi: () => void): () => void {
  tinglovchilar.add(tinglovchi);
  if (!yuklandi) {
    yuklandi = true;
    // Birinchi obunachi — IndexedDB'dan (async; yo'q yoki xato — rasmsiz).
    // Promise.resolve().then: IndexedDB umuman yo'q bo'lsa get() SINXRON
    // tashlaydi (ReferenceError) — u ham rad etilgan Promise bo'lsin, menyu
    // yiqilmasin (Vitest/jsdom topdi: indexedDB is not defined)
    Promise.resolve()
      .then(() => get<Blob>(KALIT))
      .then(almashtir, (xato: unknown) => {
        console.warn(`Profil rasmi o'qilmadi: ${String(xato)}`);
      });
  }
  return () => tinglovchilar.delete(tinglovchi);
}

/** blob: URL yoki null (rasm yo'q) */
export function useProfilRasmi(): string | null {
  return useSyncExternalStore(
    obuna,
    () => joriyUrl,
    () => null,
  );
}

export async function rasmniSaqla(blob: Blob): Promise<void> {
  await set(KALIT, blob);
  almashtir(blob);
}

export async function rasmniOchir(): Promise<void> {
  await del(KALIT);
  almashtir(undefined);
}
