// api-sxema.ts — server bilan shartnoma (19/#12): javobning shakli Zod
// sxemasi bilan. Sxema — ikki ishda bitta manba: ish vaqtida tekshiradi
// (server boshqa narsa yuborsa — aniq xato) va TS turini beradi
// (z.infer — tur qo'lda takrorlanmaydi). 15-qismdagi qo'lda yozilgan
// serverRoyxatiniTekshir/serverVazifasiniTekshir o'rnida; import fayli
// (paket.ts) — o'z tekshiruvi bilan qoladi (TEXNIK-QARZ).
// "zod/mini" — funksional API (.check(...)), klassik "zod" emas: o'lchandi
// (natijalar/12-zod-hajm.txt) — klassik +24.2 KB gzip, mini +5.8 KB;
// qoidalar va xabarlar bir xil, mini'da zanjirli metodlar yo'q
import { z } from "zod/mini";
import { Vazifa } from "./vazifa.ts";

// CSP (13/#32): script-src 'self' — eval yo'q. Zod 4 obyekt sxemalarini
// tezlashtirish uchun "new Function" bor-yo'qligini SINAB ko'radi; xato
// ushlansa ham brauzer buni CSP buzilishi deb e'lon qiladi (o'lchandi:
// natijalar/12-zod-csp.txt). jitless — sinovsiz, oddiy tekshiruv
z.config({ jitless: true });

/** Bitta vazifa: faqat uch maydon, qolgani tashlanadi (oq ro'yxat) */
export const vazifaSxemasi = z.object({
  id: z.int().check(z.positive("id musbat son emas")),
  matn: z.string().check(
    z.refine((matn) => matn.trim() !== "", "matn bo'sh"),
    z.refine(
      (matn) => matn.length <= Vazifa.MAKS_UZUNLIK,
      "matn juda uzun",
    ),
  ),
  bajarildi: z.boolean(),
});

/** GET va PUT javobi: versiya — server hisobi (0 — kalit yangi) */
export const serverRoyxatiSxemasi = z.object({
  versiya: z.int().check(z.nonnegative()),
  vazifalar: z
    .array(vazifaSxemasi)
    .check(
      z.refine(
        (vazifalar) =>
          new Set(vazifalar.map((v) => v.id)).size === vazifalar.length,
        "id takrorlangan",
      ),
    ),
});

export type ServerRoyxati = z.infer<typeof serverRoyxatiSxemasi>;

/** Birinchi muammo — o'qiladigan matn: "vazifalar.0.id: id musbat son emas" */
export function sxemaXatosi(xato: z.core.$ZodError): string {
  const [birinchi] = xato.issues;
  if (birinchi === undefined) {
    return "noma'lum";
  }
  const yol = birinchi.path.join(".");
  return yol === "" ? birinchi.message : `${yol}: ${birinchi.message}`;
}
