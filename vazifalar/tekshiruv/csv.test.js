// tekshiruv/csv.test.js — CSV yozish/o'qish (src/csv.ts, 21/#15)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  csvdanVazifalar,
  csvKatak,
  csvOqi,
  csvYoz,
  vazifalarCsv,
} from "../src/csv.ts";

describe("csvKatak", () => {
  test("oddiy, vergul, qo'shtirnoq, yangi qator", () => {
    assert.equal(csvKatak("Non olish"), "Non olish");
    assert.equal(csvKatak("Non, sut"), '"Non, sut"');
    assert.equal(
      csvKatak('«Bahor» "choyxona"'),
      '"«Bahor» ""choyxona"""',
    );
    assert.equal(csvKatak("a\nb"), '"a\nb"');
  });
  test("formula injection: = + - @ oldiga '", () => {
    assert.equal(csvKatak('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
    assert.equal(csvKatak("+998 90 000 00 00"), "'+998 90 000 00 00");
    assert.equal(csvKatak("@aziz"), "'@aziz");
  });
});

describe("csvOqi", () => {
  test("BOM, CRLF, qo'shtirnoq ichida vergul va yangi qator", () => {
    assert.deepEqual(csvOqi('﻿a,b\r\n"x, y","1\n2"\r\n'), [
      ["a", "b"],
      ["x, y", "1\n2"],
    ]);
  });
  test("\"\" — qo'shtirnoq, bo'sh qatorlar o'tkaziladi", () => {
    assert.deepEqual(csvOqi('a\n\n"say ""salom"""\n'), [
      ["a"],
      ['say "salom"'],
    ]);
  });
  test("Excel (ru/uz sozlamasi) nuqta-vergul bilan", () => {
    assert.deepEqual(csvOqi("matn;bajarildi\r\nNon, sut;ha\r\n"), [
      ["matn", "bajarildi"],
      ["Non, sut", "ha"],
    ]);
  });
  test("yozilgani o'qilganiga teng (aylanma)", () => {
    const qatorlar = [
      ["id", "matn"],
      ["1", 'Kitob "Sariq devni minib", 2-qism'],
      ["2", "-1 kg go'sht"],
    ];
    assert.deepEqual(csvOqi(csvYoz(qatorlar)), [
      qatorlar[0],
      qatorlar[1],
      ["2", "'-1 kg go'sht"],
    ]);
  });
});

describe("vazifalar CSV", () => {
  const vazifalar = [
    { id: 4, matn: "Non olish #bozor", bajarildi: false },
    { id: 9, matn: "=1+1", bajarildi: true },
  ];
  test("eksport: BOM, sarlavha, ha/yo'q, CRLF", () => {
    assert.equal(
      vazifalarCsv(vazifalar),
      "﻿id,matn,bajarildi\r\n4,Non olish #bozor,yo'q\r\n9,'=1+1,ha\r\n",
    );
  });
  test("import: aylanma — matn va holat, id 1 dan, ' olib tashlanadi", () => {
    const n = csvdanVazifalar(vazifalarCsv(vazifalar));
    assert.deepEqual(n, {
      ok: true,
      qiymat: [
        { id: 1, matn: "Non olish #bozor", bajarildi: false },
        { id: 2, matn: "=1+1", bajarildi: true },
      ],
    });
  });
  test("import xatolari — qator raqami bilan", () => {
    assert.deepEqual(csvdanVazifalar(""), {
      ok: false,
      xato: "CSV bo'sh.",
    });
    assert.deepEqual(csvdanVazifalar("nom\nx"), {
      ok: false,
      xato: "CSV'da «matn» ustuni yo'q.",
    });
    assert.deepEqual(csvdanVazifalar("matn,bajarildi\nA,ha\n,yo'q"), {
      ok: false,
      xato: "3-qatorda matn bo'sh.",
    });
    assert.deepEqual(csvdanVazifalar("matn,bajarildi\nA,balki"), {
      ok: false,
      xato: "2-qatorda «bajarildi» noto'g'ri: «balki».",
    });
  });
});
