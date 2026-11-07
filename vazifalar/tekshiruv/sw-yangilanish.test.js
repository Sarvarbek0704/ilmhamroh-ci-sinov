// tekshiruv/sw-yangilanish.test.js — «Yangi versiya tayyor» oqimi
// (src/sw-yangilanish.ts, 21/#28) brauzersiz: navigator.serviceWorker,
// document va location — soxta (vi.stubGlobal), SW — vi.fn() li obyekt.
// Modulda holat bor (kutayotgan, soralgan) — har test yangi nusxa oladi
// (vi.resetModules + dinamik import)
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

function muhit({ controller = {} } = {}) {
  const swKonteyner = Object.assign(new EventTarget(), { controller });
  const hujjat = Object.assign(new EventTarget(), {
    visibilityState: "hidden",
  });
  const joy = { reload: vi.fn() };
  vi.stubGlobal("navigator", { serviceWorker: swKonteyner });
  vi.stubGlobal("document", hujjat);
  vi.stubGlobal("location", joy);
  return { swKonteyner, hujjat, joy };
}

const soxtaSW = (state = "installed") =>
  Object.assign(new EventTarget(), { state, postMessage: vi.fn() });

const soxtaReg = ({ waiting = null, update } = {}) =>
  Object.assign(new EventTarget(), {
    waiting,
    installing: null,
    update: update ?? vi.fn(() => Promise.resolve()),
  });

const modul = () => import("../src/sw-yangilanish.ts");

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("swniKuzat", () => {
  test("kutayotgan SW bor va sahifa boshqarilgan — «Yangilash» unga xabar yuboradi", async () => {
    muhit();
    const kutayotgan = soxtaSW();
    const { swniKuzat, yangila } = await modul();
    swniKuzat(soxtaReg({ waiting: kutayotgan }));
    yangila();
    expect(kutayotgan.postMessage).toHaveBeenCalledExactlyOnceWith(
      "yangila",
    );
  });

  test("birinchi o'rnatish (controller yo'q) — taklif yo'q", async () => {
    muhit({ controller: null });
    const kutayotgan = soxtaSW();
    const { swniKuzat, yangila } = await modul();
    swniKuzat(soxtaReg({ waiting: kutayotgan }));
    yangila();
    expect(kutayotgan.postMessage).not.toHaveBeenCalled();
  });

  test("updatefound → installed bo'lgach taklif paydo bo'ladi", async () => {
    muhit();
    const reg = soxtaReg();
    const { swniKuzat, yangila } = await modul();
    swniKuzat(reg);
    const yangi = soxtaSW("installing");
    reg.installing = yangi;
    reg.dispatchEvent(new Event("updatefound"));
    yangila();
    expect(yangi.postMessage).not.toHaveBeenCalled(); // hali o'rnatilmagan
    yangi.state = "installed";
    yangi.dispatchEvent(new Event("statechange"));
    yangila();
    expect(yangi.postMessage).toHaveBeenCalledOnce();
  });

  test("controllerchange: foydalanuvchi so'ragan bo'lsa — qayta yuklanadi", async () => {
    const { swKonteyner, joy } = muhit();
    const { swniKuzat, yangila } = await modul();
    swniKuzat(soxtaReg({ waiting: soxtaSW() }));
    yangila();
    swKonteyner.dispatchEvent(new Event("controllerchange"));
    expect(joy.reload).toHaveBeenCalledOnce();
  });

  test("controllerchange boshqa tabdan — yozilayotgan matn uchun qayta yuklanmaydi", async () => {
    const { swKonteyner, joy } = muhit();
    const { swniKuzat } = await modul();
    swniKuzat(soxtaReg({ waiting: soxtaSW() }));
    swKonteyner.dispatchEvent(new Event("controllerchange"));
    expect(joy.reload).not.toHaveBeenCalled();
  });

  test("tab ko'ringanda yangilanish tekshiriladi; oflayn xato yutiladi", async () => {
    const { hujjat } = muhit();
    const update = vi.fn(() => Promise.reject(new TypeError("oflayn")));
    const { swniKuzat } = await modul();
    swniKuzat(soxtaReg({ update }));
    hujjat.dispatchEvent(new Event("visibilitychange"));
    expect(update).not.toHaveBeenCalled(); // yashirin tab
    hujjat.visibilityState = "visible";
    hujjat.dispatchEvent(new Event("visibilitychange"));
    expect(update).toHaveBeenCalledOnce();
    // rad etilgan va'da ushlanmasa — Vitest "Unhandled Rejection" bilan yiqiladi
    await Promise.resolve();
  });
});
