// tekshiruv/navbat.test.js — oflayn yozuvlar navbati (src/navbat.ts, 21/#29)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  navbatgaQosh,
  navbatniSiq,
  navbatniYubor,
} from "../src/navbat.ts";

const xotira = (boshi = []) => {
  let r = boshi;
  return { oqi: () => r, yoz: (x) => (r = x) };
};

describe("navbatniSiq", () => {
  test("ketma-ket yangila (bir id) — bitta", () => {
    assert.deepEqual(
      navbatniSiq([
        {
          tur: "yangila",
          id: 2,
          nomi: "Sut",
          maydonlar: { bajarildi: true },
        },
        {
          tur: "yangila",
          id: 2,
          nomi: "Sut",
          maydonlar: { matn: "Sut olish" },
        },
      ]),
      [
        {
          tur: "yangila",
          id: 2,
          nomi: "Sut",
          maydonlar: { bajarildi: true, matn: "Sut olish" },
        },
      ],
    );
  });
  test("mahalliy qo'shilgan: matni qosh'ga, bajarildi — alohida", () => {
    assert.deepEqual(
      navbatniSiq([
        { tur: "qosh", id: 9, matn: "Non" },
        {
          tur: "yangila",
          id: 9,
          nomi: "Non",
          maydonlar: { matn: "Non olish", bajarildi: true },
        },
      ]),
      [
        { tur: "qosh", id: 9, matn: "Non olish" },
        {
          tur: "yangila",
          id: 9,
          nomi: "Non",
          maydonlar: { bajarildi: true },
        },
      ],
    );
  });
  test("mahalliy qo'shilgan va o'chirilgan — navbat bo'sh", () => {
    assert.deepEqual(
      navbatniSiq([
        { tur: "qosh", id: 9, matn: "Non" },
        {
          tur: "yangila",
          id: 9,
          nomi: "Non",
          maydonlar: { bajarildi: true },
        },
        { tur: "ochir", id: 9, nomi: "Non" },
      ]),
      [],
    );
  });
  test("serverdagini o'chirish — oldingi yangilalari keraksiz", () => {
    assert.deepEqual(
      navbatniSiq([
        {
          tur: "yangila",
          id: 3,
          nomi: "Kitob",
          maydonlar: { bajarildi: true },
        },
        { tur: "ochir", id: 3, nomi: "Kitob" },
      ]),
      [{ tur: "ochir", id: 3, nomi: "Kitob" }],
    );
  });
});

describe("navbatniYubor", () => {
  const soxtaApi = (server, jurnal) => ({
    qosh: async (matn) => {
      jurnal.push(`POST ${matn}`);
      const v = { id: 100 + server.length, matn, bajarildi: false };
      server.push(v);
      return v;
    },
    yangila: async (id, m) => {
      jurnal.push(`PATCH ${id} ${JSON.stringify(m)}`);
      const v = server.find((x) => x.id === id);
      if (!v)
        throw Object.assign(new Error("404"), { kod: "TOPILMADI" });
      Object.assign(v, m);
      return v;
    },
    ochir: async (id) => {
      jurnal.push(`DELETE ${id}`);
      const i = server.findIndex((x) => x.id === id);
      if (i === -1)
        throw Object.assign(new Error("404"), { kod: "TOPILMADI" });
      server.splice(i, 1);
    },
  });
  test("tartib bilan; mahalliy id → server id; navbat bo'shaydi", async () => {
    const ombor = xotira();
    navbatgaQosh({ tur: "qosh", id: 4, matn: "Non" }, ombor);
    navbatgaQosh(
      {
        tur: "yangila",
        id: 4,
        nomi: "Non",
        maydonlar: { bajarildi: true },
      },
      ombor,
    );
    navbatgaQosh({ tur: "ochir", id: 1, nomi: "Eski" }, ombor);
    const server = [{ id: 1, matn: "Eski", bajarildi: false }];
    const jurnal = [];
    const n = await navbatniYubor(soxtaApi(server, jurnal), ombor);
    assert.deepEqual(jurnal, [
      "POST Non",
      'PATCH 101 {"bajarildi":true}',
      "DELETE 1",
    ]);
    assert.deepEqual(n, { yuborildi: 3, konfliktlar: [] });
    assert.deepEqual(ombor.oqi(), []);
  });
  test("konflikt: boshqa joyda o'chirilgan — yangila tashlanadi, aytiladi", async () => {
    const ombor = xotira([
      {
        tur: "yangila",
        id: 7,
        nomi: "Sut olish",
        maydonlar: { bajarildi: true },
      },
      { tur: "ochir", id: 8, nomi: "Yo'q" },
    ]);
    const n = await navbatniYubor(soxtaApi([], []), ombor);
    assert.deepEqual(n, {
      yuborildi: 0,
      konfliktlar: [
        "«Sut olish» boshqa joyda o'chirilgan — o'zgarish qo'llanmadi.",
      ],
    });
    assert.deepEqual(ombor.oqi(), []);
  });
  test("tarmoq xatosi — to'xtaydi, qolgani (xaritalangan id bilan) navbatda", async () => {
    const ombor = xotira([
      { tur: "qosh", id: 4, matn: "Non" },
      {
        tur: "yangila",
        id: 4,
        nomi: "Non",
        maydonlar: { bajarildi: true },
      },
    ]);
    const api = soxtaApi([], []);
    api.yangila = async () => {
      throw Object.assign(new TypeError("Failed to fetch"), {
        kod: "TARMOQ",
      });
    };
    await assert.rejects(navbatniYubor(api, ombor), { kod: "TARMOQ" });
    assert.deepEqual(ombor.oqi(), [
      {
        tur: "yangila",
        id: 100,
        nomi: "Non",
        maydonlar: { bajarildi: true },
      },
    ]);
  });
});
