// msw.test.tsx — 22/#07: MSW nimani tekshiradi (qo'lda fetch soxtasi
// ko'rmagan narsalar). api — ilovaning HAQIQIY klienti (server-sinxron.ts,
// .env.test dagi VITE_API_URL): URL yig'ish, sarlavhalar, JSON tana,
// javob shartnomasi (Zod) — hammasi ishlaydi, faqat tarmoq soxta
import { describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { api } from "../src/server-sinxron.ts";
import { server } from "./msw/node.ts";
import {
  serverRoyxati,
  sorovlar,
  tanalar,
  tarmoqYoq,
} from "./msw/soxta-api.ts";
import { vazifa, vazifalar } from "./yordamchi/fabrika.ts";

describe("MSW — tarmoq darajasidagi soxta server", () => {
  test("holatli server: POST dan keyin GET yangi vazifani qaytaradi", async () => {
    serverRoyxati([vazifa({ matn: "Non" })]);
    const yangi = await api.qosh("Sut");
    expect(yangi).toEqual({ id: 2, matn: "Sut", bajarildi: false });
    const { vazifalar, versiya } = await api.royxat();
    expect(vazifalar.map((v) => v.matn)).toEqual(["Non", "Sut"]);
    expect(versiya).toBe(2);
    expect(sorovlar()).toEqual(["POST", "GET"]);
    expect(tanalar()).toEqual(['POST {"matn":"Sut"}']);
  });

  test("so'rovning o'zi: to'liq URL, metod, sarlavhalar", async () => {
    let ushlangan: Request | undefined;
    server.use(
      http.patch("*/api/mashq/vazifalar/:id", ({ request }) => {
        ushlangan = request;
        return HttpResponse.json({ id: 4, matn: "A", bajarildi: true });
      }),
    );
    await api.yangila(4, { bajarildi: true });
    expect(ushlangan?.method).toBe("PATCH");
    expect(ushlangan?.url).toMatch(
      /^http:\/\/localhost:3000\/api\/mashq\/vazifalar\/4$/,
    );
    expect(ushlangan?.headers.get("content-type")).toBe(
      "application/json",
    );
    expect(ushlangan?.headers.get("accept")).toBe("application/json");
  });

  test("javob shartnomaga mos kelmasa — klient rad etadi (Zod)", async () => {
    server.use(
      http.get("*/api/mashq/vazifalar", () =>
        HttpResponse.json({ versiya: "bir", vazifalar: null }),
      ),
    );
    await expect(api.royxat()).rejects.toThrow();
  });

  test("fabrika: 250 vazifa (har 3-si bajarilgan) — server va klient bir xil", async () => {
    serverRoyxati(vazifalar(250, (i) => ({ bajarildi: i % 3 === 0 })));
    const { vazifalar: kelgan } = await api.royxat();
    expect(kelgan).toHaveLength(250);
    expect(kelgan.filter((v) => v.bajarildi)).toHaveLength(84);
    expect(kelgan.at(-1)).toEqual({
      id: 250,
      matn: "Vazifa 250",
      bajarildi: true, // i = 249 — 3 ga bo'linadi
    });
  });

  test("tarmoq yo'q — HttpResponse.error() → ApiXatosi, kod TARMOQ, holat 0", async () => {
    server.use(tarmoqYoq);
    await expect(api.royxat()).rejects.toMatchObject({
      kod: "TARMOQ",
      holat: 0,
    });
  });

  test("handler yo'q so'rov tarmoqqa chiqmaydi (onUnhandledFrame: error)", async () => {
    await expect(
      fetch("http://localhost:3000/api/boshqa"),
    ).rejects.toThrow();
  });
});
