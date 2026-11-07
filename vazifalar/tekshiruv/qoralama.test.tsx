// qoralama.test.tsx — 22/#03: debounce (13/#02 qoralamasi) soxta soat
// bilan. Yozish to'xtagach 400 ms dan keyin BIR marta saqlanadi.
// Soxta soat faqat render tugagach yoqiladi: Query va waitFor haqiqiy
// taymerlarga tayanadi (oldin yoqilsa — waitFor abadiy kutadi)
import { afterEach, expect, test, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { App } from "../src/App.tsx";
import { chiz } from "./yordamchi/chiz.tsx";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

test("qoralama: 3 harf — localStorage'ga 400 ms dan keyin bitta yozuv", async () => {
  // Server — MSW (vitest-sozlash.ts): sukut bo'yicha bo'sh ro'yxat
  chiz(<App boshlangichRoyxat={[]} qoralama="" />, {
    router: "brauzer",
  });
  const maydon = screen.getByRole("textbox", { name: "Yangi vazifa" });
  await waitFor(() =>
    expect(document.getElementById("aloqa")).toHaveProperty(
      "textContent",
      "",
    ),
  );

  // Spy: haqiqiy setItem ishlaydi, chaqiruvlar yoziladi
  const yozuv = vi.spyOn(Storage.prototype, "setItem");
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  for (const matn of ["N", "No", "Non"]) {
    fireEvent.input(maydon, { target: { value: matn } });
    vi.advanceTimersByTime(100);
  }
  const qoralamaYozuvlari = () =>
    yozuv.mock.calls.filter(
      ([kalit]) => kalit === "vazifalar:qoralama",
    );
  vi.advanceTimersByTime(299); // oxirgi harfdan 399 ms
  expect(qoralamaYozuvlari()).toEqual([]);
  vi.advanceTimersByTime(1);
  expect(qoralamaYozuvlari()).toEqual([["vazifalar:qoralama", "Non"]]);
});
