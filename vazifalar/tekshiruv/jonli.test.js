// tekshiruv/jonli.test.js — dev server SSE plagini (19/#18): soxta
// so'rov/javob obyektlari bilan (haqiqiy server — jonli.sh, natijalar/18-*)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { jonliPlagini } from "../skriptlar/jonli.js";

function middlewareOl() {
  let mw;
  jonliPlagini().configureServer({
    middlewares: { use: (f) => (mw = f) },
  });
  return mw;
}
const sorov = (method, url, headers = {}) =>
  Object.assign(new EventEmitter(), { method, url, headers });
const javob = () =>
  Object.assign(new EventEmitter(), {
    statusCode: 200,
    yozilgan: [],
    writeHead(holat, sarlavhalar) {
      this.holat = holat;
      this.sarlavhalar = sarlavhalar;
    },
    write(matn) {
      this.yozilgan.push(matn);
    },
  });

describe("jonliPlagini (dev SSE)", () => {
  test("faqat dev server'da (apply: serve)", () => {
    assert.equal(jonliPlagini().apply, "serve");
  });

  test("yozuv o'tdi (status < 400) — shu kalit tinglovchilariga hodisa, manba bilan", () => {
    const mw = middlewareOl();
    const tinglovchi = javob();
    const begona = javob();
    mw(sorov("GET", "/api/jonli/k1"), tinglovchi, () => assert.fail());
    mw(sorov("GET", "/api/jonli/k2"), begona, () => assert.fail());
    assert.equal(
      tinglovchi.sarlavhalar["Content-Type"],
      "text/event-stream",
    );
    let keyingi = 0;
    const yozuv = javob();
    mw(
      sorov("PATCH", "/api/mashq/vazifalar/k1/3", {
        "x-jonli-manba": "tab-a",
      }),
      yozuv,
      () => keyingi++,
    );
    assert.equal(keyingi, 1); // proxy'ga o'tdi
    yozuv.emit("finish");
    assert.deepEqual(tinglovchi.yozilgan, [
      "retry: 2000\n\n",
      'event: ozgardi\ndata: {"manba":"tab-a"}\n\n',
    ]);
    assert.deepEqual(begona.yozilgan, ["retry: 2000\n\n"]);
  });

  test("GET yoki xato javob — hodisa yo'q; ulanish yopilsa — o'chadi", () => {
    const mw = middlewareOl();
    const sse = sorov("GET", "/api/jonli/k1");
    const tinglovchi = javob();
    mw(sse, tinglovchi, () => {});
    const oqish = javob();
    mw(sorov("GET", "/api/mashq/vazifalar/k1"), oqish, () => {});
    oqish.emit("finish");
    const xato = Object.assign(javob(), { statusCode: 500 });
    mw(sorov("POST", "/api/mashq/vazifalar/k1"), xato, () => {});
    xato.emit("finish");
    sse.emit("close");
    const keyin = javob();
    mw(sorov("PUT", "/api/mashq/vazifalar/k1"), keyin, () => {});
    keyin.emit("finish");
    assert.deepEqual(tinglovchi.yozilgan, ["retry: 2000\n\n"]);
  });
});
