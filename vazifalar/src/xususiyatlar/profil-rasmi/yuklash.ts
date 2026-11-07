// yuklash.ts — faylni serverga yuborish, jarayon (progress) bilan
// (19/#36). fetch() yuborish jarayonini (upload progress) bermaydi —
// XMLHttpRequest beradi: xhr.upload "progress" hodisasi. Server — «Bahor»
// mashq API'sining /aks manzili: faylni SAQLAMAYDI, faqat nima kelganini
// aytadi (nom, hajm, tur) — "soxta" yuklash, lekin tarmoq haqiqiy
import { z } from "zod/mini";

const javobSxemasi = z.object({
  tana: z.array(
    z.object({ nom: z.string(), hajm: z.number(), tur: z.string() }),
  ),
});

export type Jarayon = {
  readonly yuborildi: number;
  readonly jami: number;
};

export function faylniYukla(
  manzil: string,
  fayl: Blob,
  sozlama: { onJarayon: (j: Jarayon) => void; signal: AbortSignal },
): Promise<void> {
  return new Promise((hal, rad) => {
    const xhr = new XMLHttpRequest();
    const malumot = new FormData();
    malumot.append("rasm", fayl);
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        sozlama.onJarayon({
          yuborildi: event.loaded,
          jami: event.total,
        });
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        rad(new Error(`Server xatosi: ${xhr.status}`));
        return;
      }
      // Server haqiqatan shu hajmdagi faylni olganmi
      const natija = javobSxemasi.safeParse(
        JSON.parse(xhr.responseText),
      );
      const kelgan = natija.success ? natija.data.tana[0] : undefined;
      if (kelgan?.hajm !== fayl.size) {
        rad(new Error("Server faylni to'liq olmadi."));
        return;
      }
      hal();
    });
    xhr.addEventListener("error", () =>
      rad(new Error("Internet aloqasini tekshiring.")),
    );
    xhr.addEventListener("abort", () =>
      rad(new DOMException("Yuklash bekor qilindi.", "AbortError")),
    );
    sozlama.signal.addEventListener("abort", () => xhr.abort(), {
      once: true,
    });
    xhr.open("POST", manzil);
    xhr.send(malumot);
  });
}
