// tekshiruv/paket.test.js — eksport matni va importni tekshirish
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  eksportMatni,
  eksportFaylNomi,
  paketniOqi,
  paketniTekshir,
} from "../src/paket.ts";
import { VazifaXatosi } from "../src/vazifa.ts";

const paket = (qator) => `{"versiya": 1, "vazifalar": [${qator}]}`;

// Xato turi, kodi va matni — uchalasi ham foydalanuvchiga ko'rinadi
function xatoBilan(matn, kod, xabar) {
  assert.throws(
    () => paketniOqi(matn),
    (xato) => {
      assert.ok(xato instanceof VazifaXatosi);
      assert.equal(xato.name, "VazifaXatosi");
      assert.equal(xato.kod, kod);
      assert.equal(xato.message, xabar);
      return true;
    },
  );
}

describe("eksportMatni", () => {
  test("aniq shakl: versiya, 2 bo'sh joy, faqat uch maydon", () => {
    const vazifalar = [
      { id: 7, matn: "Choy", bajarildi: false, maxfiy: "yo'q" },
    ];
    assert.equal(
      eksportMatni(vazifalar),
      [
        "{",
        '  "versiya": 1,',
        '  "vazifalar": [',
        "    {",
        '      "id": 7,',
        '      "matn": "Choy",',
        '      "bajarildi": false',
        "    }",
        "  ]",
        "}",
      ].join("\n"),
    );
  });
});

describe("paketniOqi", () => {
  test("to'g'ri paket o'qiladi", () => {
    assert.deepEqual(
      paketniOqi(
        paket('{"id": 7, "matn": "Choy", "bajarildi": false}'),
      ),
      [{ id: 7, matn: "Choy", bajarildi: false }],
    );
  });

  test("begona maydonlar tashlanadi", () => {
    const [vazifa] = paketniOqi(
      paket('{"id": 1, "matn": "A", "bajarildi": true, "admin": 1}'),
    );
    assert.deepEqual(Object.keys(vazifa), ["id", "matn", "bajarildi"]);
  });

  test("JSON emas", () => {
    xatoBilan(
      '{"versiya": 1, "vazifalar": [}',
      "JSON",
      "Matn JSON emas. Eksportni to'liq oling.",
    );
  });

  test("JSON xatosi cause'da saqlanadi", () => {
    assert.throws(
      () => paketniOqi("{"),
      (xato) => xato.cause instanceof SyntaxError,
    );
  });

  test("obyekt emas: null, massiv, son", () => {
    for (const matn of ["null", "[]", "5"]) {
      xatoBilan(matn, "TUZILMA", "Bu matn vazifalar eksporti emas.");
    }
  });

  test("boshqa versiya", () => {
    xatoBilan(
      '{"versiya": 2, "vazifalar": []}',
      "VERSIYA",
      "Versiya 2 o'qilmaydi — faqat 1.",
    );
  });

  test("vazifalar massiv emas", () => {
    xatoBilan(
      '{"versiya": 1, "vazifalar": {}}',
      "TUZILMA",
      "Matnda vazifalar ro'yxati yo'q.",
    );
  });

  test("har maydon tekshiriladi, tartib raqami bilan", () => {
    const holatlar = [
      [
        '{"matn": "id siz", "bajarildi": true}',
        "1-vazifa: id musbat, takrorlanmas son emas.",
      ],
      [
        '{"id": 0, "matn": "A", "bajarildi": true}',
        "1-vazifa: id musbat, takrorlanmas son emas.",
      ],
      [
        '{"id": 1, "matn": "  ", "bajarildi": true}',
        "1-vazifa: matn bo'sh.",
      ],
      [
        `{"id": 1, "matn": "${"x".repeat(101)}", "bajarildi": true}`,
        "1-vazifa: matn juda uzun.",
      ],
      [
        '{"id": 1, "matn": "A", "bajarildi": "ha"}',
        "1-vazifa: bajarildi true yoki false emas.",
      ],
      [
        '{"id": 1, "matn": "A", "bajarildi": true}, ' +
          '{"id": 1, "matn": "B", "bajarildi": true}',
        "2-vazifa: id musbat, takrorlanmas son emas.",
      ],
    ];
    for (const [qator, xabar] of holatlar) {
      xatoBilan(paket(qator), "VAZIFA", xabar);
    }
  });

  test("__proto__ kaliti prototipni buzmaydi", () => {
    paketniOqi(
      '{"__proto__": {"admin": true}, "versiya": 1, ' +
        '"vazifalar": []}',
    );
    assert.equal({}.admin, undefined);
  });
});

describe("eksportFaylNomi", () => {
  test("mahalliy sana, oy va kun ikki xonali", () => {
    assert.equal(
      eksportFaylNomi(new Date(2026, 9, 5, 2, 30)),
      "vazifalar-2026-10-05.json",
    );
    assert.equal(
      eksportFaylNomi(new Date(2027, 0, 9)),
      "vazifalar-2027-01-09.json",
    );
  });
});

// 15/#44: Natija (Result) — kutilgan xato throw emas, qiymat
describe("paketniTekshir", () => {
  test("to'g'ri matn — ok: true, qiymat", () => {
    assert.deepEqual(
      paketniTekshir(
        paket('{"id": 1, "matn": "Non", "bajarildi": false}'),
      ),
      { ok: true, qiymat: [{ id: 1, matn: "Non", bajarildi: false }] },
    );
  });

  test("buzuq matn — ok: false, xato VazifaXatosi (throw yo'q)", () => {
    const natija = paketniTekshir("{");
    assert.equal(natija.ok, false);
    assert.ok(natija.xato instanceof VazifaXatosi);
    assert.equal(natija.xato.kod, "JSON");
  });
});
