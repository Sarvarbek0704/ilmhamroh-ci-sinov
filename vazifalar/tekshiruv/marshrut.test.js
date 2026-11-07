// tekshiruv/marshrut.test.js — filtr URL'da. 19/#09 dan URL'ga yozish —
// React Router (useUrlTanlovi); bu yerda sof qism: o'qish va yangi
// parametrlar (pushState, location o'rinbosari endi kerak emas)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  filtrniOl,
  parametrniQoy,
  saralashniOl,
} from "../src/marshrut.ts";

const sayt = "https://login.github.io/vazifalar/";

describe("filtrniOl", () => {
  const holatlar = [
    ["?filtr=faol", "faol"],
    ["?filtr=bajarilgan&muvaffaqiyatsiz=1", "bajarilgan"],
    ["?filtr=constructor", "hammasi"],
    ["?filtr=FAOL", "hammasi"],
    ["", "hammasi"],
  ];
  for (const [qism, kutilgan] of holatlar) {
    test(`«${qism}» → ${kutilgan}`, () => {
      assert.equal(filtrniOl(sayt + qism), kutilgan);
    });
  }
});

describe("parametrniQoy", () => {
  const qoy = (qidiruv, nomi, qiymat, standart) =>
    parametrniQoy(
      new URLSearchParams(qidiruv),
      nomi,
      qiymat,
      standart,
    ).toString();

  test("filtr parametrga yoziladi", () => {
    assert.equal(qoy("", "filtr", "faol", "hammasi"), "filtr=faol");
  });

  test("standart — parametr o'chadi, boshqalari qoladi", () => {
    assert.equal(
      qoy(
        "muvaffaqiyatsiz=1&filtr=faol",
        "filtr",
        "hammasi",
        "hammasi",
      ),
      "muvaffaqiyatsiz=1",
    );
  });

  test("saralash yoziladi, filtr joyida; eski obyekt o'zgarmaydi", () => {
    const eski = new URLSearchParams("filtr=faol");
    const yangi = parametrniQoy(eski, "saralash", "alifbo", "standart");
    assert.equal(yangi.toString(), "filtr=faol&saralash=alifbo");
    assert.equal(eski.toString(), "filtr=faol");
  });

  test("URLSearchParams ham o'qiladi (router beradigani)", () => {
    const p = new URLSearchParams("filtr=bajarilgan&saralash=yangi");
    assert.deepEqual(
      [filtrniOl(p), saralashniOl(p)],
      ["bajarilgan", "yangi"],
    );
  });
});

describe("saralash URL'da", () => {
  const holatlar = [
    ["?saralash=alifbo", "alifbo"],
    ["?filtr=faol&saralash=yangi", "yangi"],
    ["?saralash=__proto__", "standart"],
    ["", "standart"],
  ];
  for (const [qism, kutilgan] of holatlar) {
    test(`«${qism}» → ${kutilgan}`, () => {
      assert.equal(saralashniOl(sayt + qism), kutilgan);
    });
  }
});
