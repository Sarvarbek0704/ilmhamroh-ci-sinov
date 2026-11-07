// soxta-api.ts — 22/#07: mashq API'ning soxtasi MSW bilan (tarmoq
// darajasida). Ilova kodi o'zgarmaydi: fetch haqiqiy so'rov yuboradi,
// MSW uni tarmoqqa chiqmasdan ushlaydi va shu handlerlar javob beradi.
// Handlerlar — Node (server.ts, setupServer) va brauzer (#08 Browser
// Mode, setupWorker) uchun umumiy. Server holati — xotirada: POST
// qo'shadi, PATCH o'zgartiradi, keyingi GET o'zgarganini qaytaradi
import { http, HttpResponse } from "msw";
import type { VazifaMalumoti } from "../../src/turlar.ts";

// .env.test dagi VITE_API_URL bilan bir xil yo'l. 25-qismdan: o'z
// API'miz — ro'yxat kalitsiz (?limit=100), egasi — sessiyadan
const YOL = "*/api/mashq/vazifalar";
/** shu API ning istalgan so'rovi (ro'yxat ham, /:id ham) */
const HAMMASI = /\/api\/mashq\/vazifalar(\/|$)/;

type Holat = {
  versiya: number;
  vazifalar: VazifaMalumoti[];
  /** "GET", "POST", "PATCH /1" — qaysi so'rovlar qaysi tartibda ketdi */
  sorovlar: string[];
  /** yozuv so'rovlarining tanasi: "PATCH {\"matn\":\"…\"}" */
  tanalar: string[];
};

const holat: Holat = {
  versiya: 1,
  vazifalar: [],
  sorovlar: [],
  tanalar: [],
};

/** Server shu ro'yxat bilan boshlaydi (afterEach — bo'sh ro'yxat) */
export function serverRoyxati(
  vazifalar: readonly VazifaMalumoti[] = [],
  versiya = 1,
): void {
  holat.versiya = versiya;
  holat.vazifalar = vazifalar.map((v) => ({ ...v }));
  holat.sorovlar = [];
  holat.tanalar = [];
}

export const sorovlar = (): readonly string[] => holat.sorovlar;
export const tanalar = (): readonly string[] => holat.tanalar;

async function yoz(
  metod: string,
  request: Request,
  id?: number,
): Promise<unknown> {
  holat.sorovlar.push(id === undefined ? metod : `${metod} /${id}`);
  if (metod === "GET" || metod === "DELETE") return undefined;
  const matn = await request.text();
  holat.tanalar.push(`${metod} ${matn}`);
  return JSON.parse(matn) as unknown;
}

const royxatJavobi = () =>
  HttpResponse.json({
    versiya: holat.versiya,
    vazifalar: holat.vazifalar,
  });

export const handlerlar = [
  http.get(YOL, async ({ request }) => {
    await yoz("GET", request);
    return royxatJavobi();
  }),
  http.put(YOL, async ({ request }) => {
    const tana = (await yoz("PUT", request)) as {
      vazifalar: VazifaMalumoti[];
    };
    holat.vazifalar = tana.vazifalar;
    holat.versiya++;
    return royxatJavobi();
  }),
  http.post(YOL, async ({ request }) => {
    const { matn } = (await yoz("POST", request)) as { matn: string };
    const id = Math.max(0, ...holat.vazifalar.map((v) => v.id)) + 1;
    const yangi = { id, matn, bajarildi: false };
    holat.vazifalar.push(yangi);
    holat.versiya++;
    return HttpResponse.json(yangi, { status: 201 });
  }),
  http.patch(`${YOL}/:id`, async ({ request, params }) => {
    const id = Number(params["id"]);
    const tana = (await yoz("PATCH", request, id)) as object;
    const eski = holat.vazifalar.find((v) => v.id === id);
    if (eski === undefined) {
      return HttpResponse.json({ xato: "topilmadi" }, { status: 404 });
    }
    const yangi = { ...eski, ...tana };
    holat.vazifalar = holat.vazifalar.map((v) =>
      v.id === id ? yangi : v,
    );
    holat.versiya++;
    return HttpResponse.json(yangi);
  }),
  http.delete(`${YOL}/:id`, async ({ request, params }) => {
    const id = Number(params["id"]);
    await yoz("DELETE", request, id);
    holat.vazifalar = holat.vazifalar.filter((v) => v.id !== id);
    holat.versiya++;
    return new HttpResponse(null, { status: 204 });
  }),
];

// Bitta test uchun xulq (server.use(...) — afterEach resetHandlers bilan
// asl handlerlarga qaytadi)

/** Tarmoq xatosi: fetch TypeError ("Failed to fetch") bilan yiqiladi */
export const tarmoqYoq = http.all(HAMMASI, () => HttpResponse.error());

/** Har qanday so'rovga 500 */
export const server500 = http.all(HAMMASI, () =>
  HttpResponse.json({ xato: "Ataylab" }, { status: 500 }),
);

/** O'qish ishlaydi, yozuv (POST/PATCH/PUT/DELETE) — 500 */
export const yozuvXatosi = http.all(HAMMASI, async ({ request }) => {
  if (request.method === "GET") return undefined; // keyingi handlerga
  const id = /\/(\d+)$/.exec(new URL(request.url).pathname)?.[1];
  await yoz(
    request.method,
    request,
    id === undefined ? id : Number(id),
  );
  return HttpResponse.json({ xato: "Ataylab" }, { status: 500 });
});
