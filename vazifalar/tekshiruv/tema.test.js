// tekshiruv/tema.test.js — tema tanlovi (DOM'siz qismi)
import "./xotira.js";
import { beforeEach, describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  TEMALAR,
  tanlovniOl,
  korinadiganTema,
} from "../src/tema-tanlash.ts";
import { temaniSaqla, temaniOl } from "../src/saqlash.ts";

beforeEach(() => localStorage.clear());

describe("tema", () => {
  test("tanlovniOl: faqat uch qiymat, qolgani — tizim", () => {
    assert.deepEqual(TEMALAR, ["tizim", "yorug", "qorongi"]);
    assert.equal(tanlovniOl("qorongi"), "qorongi");
    assert.equal(tanlovniOl(null), "tizim");
    assert.equal(tanlovniOl("dark"), "tizim");
  });

  test("korinadiganTema: tanlov tizimdan ustun", () => {
    assert.equal(korinadiganTema("yorug", true), "yorug");
    assert.equal(korinadiganTema("qorongi", false), "qorongi");
  });

  test("korinadiganTema: tizim — tizim sozlamasiga qaraydi", () => {
    assert.equal(korinadiganTema("tizim", true), "qorongi");
    assert.equal(korinadiganTema("tizim", false), "yorug");
  });

  test("temaniSaqla: tanlov yoziladi, tizim — yozuv o'chadi", () => {
    temaniSaqla("qorongi");
    assert.equal(localStorage.getItem("vazifalar:tema"), "qorongi");
    assert.equal(temaniOl(), "qorongi");
    temaniSaqla("tizim");
    assert.equal(temaniOl(), null);
  });
});
