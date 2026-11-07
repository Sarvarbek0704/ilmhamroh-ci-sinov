// XatoChegarasi.test.tsx — error boundary (18/#08): ushlash, tiklash,
// tiklashKaliti; hodisa ishlovchisidagi xatoni USHLAMASLIGI
import { afterEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { XatoChegarasi } from "../src/komponentlar/XatoChegarasi.tsx";

let portlasinmi = true;
function Bomba() {
  if (portlasinmi) {
    throw new Error("Bomba portladi");
  }
  return <p>Ishlayapti</p>;
}

const fallback = (xato: unknown, qaytaUrin: () => void) => (
  <div role="alert">
    {xato instanceof Error ? xato.message : "?"}
    <button onClick={qaytaUrin}>Qayta urinish</button>
  </div>
);

afterEach(() => {
  portlasinmi = true;
  vi.restoreAllMocks();
});

describe("XatoChegarasi", () => {
  test("render xatosi — fallback, onXato'da componentStack; «Qayta urinish» tiklaydi", () => {
    // React xatoni konsolga ham yozadi (dev) — testda jim
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onXato = vi.fn();
    render(
      <XatoChegarasi fallback={fallback} onXato={onXato}>
        <Bomba />
      </XatoChegarasi>,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Bomba portladi",
    );
    expect(onXato).toHaveBeenCalledTimes(1);
    expect(String(onXato.mock.calls[0]?.[1].componentStack)).toContain(
      "Bomba",
    );
    // Hali ham buzuq — qayta urinish yana fallback
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("alert")).toBeTruthy();
    portlasinmi = false;
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Ishlayapti")).toBeTruthy();
  });

  test("tiklashKaliti o'zgarsa — o'zi qayta urinadi", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <XatoChegarasi fallback={fallback} tiklashKaliti={1}>
        <Bomba />
      </XatoChegarasi>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    portlasinmi = false;
    rerender(
      <XatoChegarasi fallback={fallback} tiklashKaliti={2}>
        <Bomba />
      </XatoChegarasi>,
    );
    expect(screen.getByText("Ishlayapti")).toBeTruthy();
  });

  test("hodisa ishlovchisidagi xatoni ushlamaydi (fallback yo'q)", () => {
    const xatolar: unknown[] = [];
    const ushla = (e: ErrorEvent) => {
      xatolar.push(e.error);
      e.preventDefault();
    };
    addEventListener("error", ushla);
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <XatoChegarasi fallback={fallback}>
        <button
          onClick={() => {
            throw new Error("Hodisada xato");
          }}
        >
          Bos
        </button>
      </XatoChegarasi>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Bos" }));
    removeEventListener("error", ushla);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(xatolar.map((x) => (x as Error).message)).toEqual([
      "Hodisada xato",
    ]);
  });
});
