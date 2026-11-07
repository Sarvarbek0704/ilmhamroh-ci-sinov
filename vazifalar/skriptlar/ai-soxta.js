// skriptlar/ai-soxta.js — SOXTA AI javobi, faqat dev server'da (21/#26).
// POST /__ai/chat { xabarlar: [{ rol, matn }] } → Server-Sent Events oqimi:
// "data: {"matn":"bo'lak"}" har 30 ms da, oxirida "event: tugadi".
// Haqiqiy LLM yo'q (API kalit — hech qachon brauzerda emas: 25/31-qismda
// o'z backend'imiz modelga so'raydi, brauzer esa shu shakldagi oqimni oladi).
// Xabarda "xato" so'zi bo'lsa — oqim o'rtasida uziladi (xato holatini sinash)
const MANZIL = "/__ai/chat";
const BOLAK_MS = 30;

/**
 * Savolga qarab tayyor javob (Markdown) — so'zma-so'z yuboriladi
 * @param {string} savol
 */
function javob(savol) {
  return [
    `**${savol.slice(0, 40)}** — yaxshi savol. Vazifani qadamlarga bo'lamiz:`,
    "",
    "1. Kerakli narsalar ro'yxatini yozing",
    "2. Har biriga `#teg` qo'ying (masalan `#bozor`)",
    "3. Eng muhimini birinchi bajaring",
    "",
    "_Bu soxta javob: dev serverdagi skriptlar/ai-soxta.js yozdi._",
  ].join("\n");
}

/** @returns {import("vite").Plugin} */
export function aiSoxtaPlagini() {
  return {
    name: "vazifalar-ai-soxta",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, keyingi) => {
        if (req.method !== "POST" || req.url !== MANZIL) {
          keyingi();
          return;
        }
        /** @type {Buffer[]} */
        const bolaklar = [];
        req.on("data", (b) => bolaklar.push(b));
        req.on("end", () => {
          let savol = "";
          try {
            const tana = JSON.parse(
              Buffer.concat(bolaklar).toString("utf8"),
            );
            savol = String(tana.xabarlar?.at(-1)?.matn ?? "");
          } catch {
            res.writeHead(400).end();
            return;
          }
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-store",
          });
          const sozlar = javob(savol).split(/(?<=\s)/);
          let i = 0;
          const taymer = setInterval(() => {
            if (savol.includes("xato") && i === 6) {
              clearInterval(taymer);
              res.destroy(); // uzilish — brauzerda o'qish xatosi
              return;
            }
            if (i >= sozlar.length) {
              clearInterval(taymer);
              res.end("event: tugadi\ndata: {}\n\n");
              return;
            }
            res.write(
              `data: ${JSON.stringify({ matn: sozlar[i] })}\n\n`,
            );
            i++;
          }, BOLAK_MS);
          // Brauzer to'xtatdi (AbortController) — oqim ham to'xtaydi. req'ning
          // "close" i EMAS: u tana o'qib bo'lingach darhol keladi (Node 16+)
          res.on("close", () => clearInterval(taymer));
        });
      });
    },
  };
}
