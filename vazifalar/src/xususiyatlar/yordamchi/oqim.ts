// oqim.ts — Server-Sent Events matnini o'qish (21/#26). EventSource faqat
// GET qiladi va tana yubora olmaydi — chat esa POST (xabarlar tarixi).
// Shuning uchun fetch + response.body (ReadableStream) va o'zimiz ajratamiz:
// hodisalar "\n\n" bilan, har qatori "event: …" yoki "data: …".
// Sof (DOM'siz) — Vitest (node muhiti) (Node'da ham ReadableStream bor)

export type OqimHodisasi = {
  readonly tur: string; // "message" (sukut) yoki "event:" dagi nom
  readonly malumot: string;
};

/** Baytlar oqimi → hodisalar (bo'laklar istalgan joyda uzilishi mumkin) */
export async function* sseHodisalari(
  oqim: ReadableStream<BufferSource>, // response.body ham shu turga mos
): AsyncGenerator<OqimHodisasi> {
  // TextDecoderStream — UTF-8 harf ikki bo'lakka bo'linsa ham to'g'ri
  const oquvchi = oqim.pipeThrough(new TextDecoderStream()).getReader();
  let qoldiq = "";
  try {
    for (;;) {
      const { value, done } = await oquvchi.read();
      if (done) {
        break;
      }
      qoldiq += value.replaceAll("\r\n", "\n");
      let chegara = qoldiq.indexOf("\n\n");
      while (chegara !== -1) {
        const blok = qoldiq.slice(0, chegara);
        qoldiq = qoldiq.slice(chegara + 2);
        let tur = "message";
        const malumot: string[] = [];
        for (const qator of blok.split("\n")) {
          if (qator.startsWith("event:")) {
            tur = qator.slice(6).trim();
          } else if (qator.startsWith("data:")) {
            malumot.push(qator.slice(5).replace(/^ /, ""));
          }
        }
        if (malumot.length > 0 || tur !== "message") {
          yield { tur, malumot: malumot.join("\n") };
        }
        chegara = qoldiq.indexOf("\n\n");
      }
    }
  } finally {
    oquvchi.releaseLock();
  }
}
