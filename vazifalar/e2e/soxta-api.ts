// soxta-api.ts — 22/#09: mashq API'ning soxtasi Playwright'da (page.route).
// MSW (tekshiruv/msw) bilan bir xil xulq: holatli xotira server. Farqi —
// ushlash joyi: brauzer tarmoq qatlami (CDP Fetch), ilova kodi bilmaydi
import type { Page } from "@playwright/test";

export type Vazifa = { id: number; matn: string; bajarildi: boolean };

const BOSHLANGICH: readonly Vazifa[] = [
  { id: 1, matn: "Non olish #bozor", bajarildi: false },
  { id: 2, matn: "Sut olish #bozor", bajarildi: true },
  { id: 3, matn: "Kitob o'qish #uy", bajarildi: false },
];

export type SoxtaServer = {
  versiya: number;
  vazifalar: Vazifa[];
  /** "GET", "POST", "PATCH /1" … */
  sorovlar: string[];
  /** yozuv so'rovlari tanasi: "PATCH /1 {...}" */
  tanalar: string[];
};

export async function soxtaApi(
  page: Page,
  boshi: readonly Vazifa[] = BOSHLANGICH,
): Promise<SoxtaServer> {
  const s: SoxtaServer = {
    versiya: 1,
    vazifalar: boshi.map((v) => ({ ...v })),
    sorovlar: [],
    tanalar: [],
  };
  // 28-qism: auth yo'llari. Kimlik — cookie'da (kirish.setup.ts uni
  // storageState'ga yozadi); cookie yo'q — 401, ya'ni "yangi brauzer"
  await page.route(
    /\/v1\/auth\/(men|kirish|chiqish)$/,
    async (route) => {
      const yol = new URL(route.request().url()).pathname;
      const sarlavhalar = await route.request().allHeaders();
      const kirgan = (sarlavhalar["cookie"] ?? "").includes("sessiya=");
      const men = {
        foydalanuvchi: {
          id: 1,
          email: "s@example.com",
          toliqIsm: "Sinovchi",
        },
      };
      if (yol.endsWith("/kirish")) {
        return route.fulfill({
          json: men,
          headers: { "Set-Cookie": "sessiya=e2e; Path=/; HttpOnly" },
        });
      }
      if (yol.endsWith("/chiqish")) {
        return route.fulfill({
          status: 204,
          headers: { "Set-Cookie": "sessiya=; Path=/; Max-Age=0" },
        });
      }
      return kirgan
        ? route.fulfill({ json: men })
        : route.fulfill({ status: 401, json: { status: 401 } });
    },
  );
  // 25-qism: ro'yxat kalitsiz — /vazifalar?limit=100 va /vazifalar/:id
  await page.route(
    /\/api\/mashq\/vazifalar(\/\d+)?(\?.*)?$/,
    async (route) => {
      const sorov = route.request();
      const metod = sorov.method();
      const raqam = /\/vazifalar\/(\d+)$/.exec(
        new URL(sorov.url()).pathname,
      )?.[1];
      const id = raqam === undefined ? undefined : Number(raqam);
      const belgi = id === undefined ? metod : `${metod} /${id}`;
      s.sorovlar.push(belgi);
      const tana = sorov.postData();
      if (tana !== null) s.tanalar.push(`${belgi} ${tana}`);

      if (metod === "GET") {
        return route.fulfill({
          json: { versiya: s.versiya, vazifalar: s.vazifalar },
        });
      }
      s.versiya++;
      if (metod === "POST") {
        const { matn } = JSON.parse(tana ?? "{}") as { matn: string };
        const yangi = {
          id: Math.max(0, ...s.vazifalar.map((v) => v.id)) + 1,
          matn,
          bajarildi: false,
        };
        s.vazifalar.push(yangi);
        return route.fulfill({ status: 201, json: yangi });
      }
      const eski = s.vazifalar.find((v) => v.id === id);
      if (eski === undefined) {
        return route.fulfill({
          status: 404,
          json: { xato: "topilmadi" },
        });
      }
      if (metod === "DELETE") {
        s.vazifalar = s.vazifalar.filter((v) => v !== eski);
        return route.fulfill({ status: 204 });
      }
      Object.assign(eski, JSON.parse(tana ?? "{}") as Partial<Vazifa>);
      return route.fulfill({ json: eski });
    },
  );
  return s;
}
