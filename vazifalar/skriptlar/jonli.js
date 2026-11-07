// skriptlar/jonli.js — real-time yangilanish, FAQAT dev server'da
// (19/#18). Server-Sent Events: brauzer GET /api/jonli/<kalit> ochib
// qo'yadi, dev server unga "ozgardi" hodisasini yuboradi — shu kalitli
// ro'yxatga (dev proxy orqali) yozuv o'tganda. Ikki qurilma (yoki ikki
// brauzer) bir kalit bilan — biri o'zgartirsa, ikkinchisi serverdan
// qayta so'raydi. «Bahor» mashq serveri hodisa yubormaydi — shuning uchun
// hodisani proxy'ning o'zi yasaydi. Production'da (Pages, Vercel) YO'Q:
// statik hostingda doimiy ulanish ushlab turadigan server yo'q — 25-qismda
// o'z backend'imiz bilan
const JONLI = "/api/jonli/";
const YOZUV = /^\/api\/mashq\/vazifalar\/([^/?]+)/;

/**
 * @returns {import("vite").Plugin}
 */
export function jonliPlagini() {
  /** @type {Map<string, Set<import("node:http").ServerResponse>>} */
  const tinglovchilar = new Map();

  /**
   * @param {string} kalit
   * @param {string} manba yozgan tab (o'zi o'z hodisasini e'tiborsiz qoldiradi)
   */
  function yubor(kalit, manba) {
    for (const javob of tinglovchilar.get(kalit) ?? []) {
      javob.write(
        `event: ozgardi\ndata: ${JSON.stringify({ manba })}\n\n`,
      );
    }
  }

  return {
    name: "vazifalar-jonli",
    apply: "serve",
    configureServer(server) {
      // Vite'ning o'z middleware'laridan (proxy ham) OLDIN ishlaydi
      server.middlewares.use((req, res, keyingi) => {
        const url = req.url ?? "";
        if (req.method === "GET" && url.startsWith(JONLI)) {
          const kalit = decodeURIComponent(url.slice(JONLI.length));
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-store",
            Connection: "keep-alive",
          });
          // retry — uzilsa brauzer necha ms dan keyin qayta ulanadi
          res.write("retry: 2000\n\n");
          const toplam = tinglovchilar.get(kalit) ?? new Set();
          toplam.add(res);
          tinglovchilar.set(kalit, toplam);
          req.on("close", () => toplam.delete(res));
          return;
        }
        const mos = YOZUV.exec(url);
        if (
          mos !== null &&
          req.method !== "GET" &&
          mos[1] !== undefined
        ) {
          const kalit = decodeURIComponent(mos[1]);
          const manba = String(req.headers["x-jonli-manba"] ?? "");
          // Proxy javobni qaytargach — muvaffaqiyatli bo'lsa, hodisa
          res.on("finish", () => {
            if (res.statusCode < 400) {
              yubor(kalit, manba);
            }
          });
        }
        keyingi();
      });
    },
  };
}
