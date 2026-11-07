// Combobox.test.tsx — maxsus input (19/#35): ARIA combobox, klaviatura
import { describe, expect, test, vi } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Combobox } from "../src/ui/Combobox.tsx";

function Sinov({ onSubmit }: { onSubmit: () => void }) {
  const [qiymat, setQiymat] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="teg">Teg</label>
      <Combobox
        id="teg"
        qiymat={qiymat}
        onOzgar={setQiymat}
        takliflar={["#bozor", "#bolalar", "#uy"]}
      />
    </form>
  );
}

const maydon = () =>
  screen.getByRole<HTMLInputElement>("combobox", { name: "Teg" });

describe("Combobox", () => {
  test("yozilganda — mos takliflar, aria-expanded", () => {
    render(<Sinov onSubmit={() => {}} />);
    fireEvent.change(maydon(), { target: { value: "#bo" } });
    expect(maydon().getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getAllByRole("option").map((o) => o.textContent),
    ).toEqual(["#bozor", "#bolalar"]);
  });

  test("↓ ↓ ↑ — faol taklif (activedescendant), Enter — tanlaydi, forma yuborilmaydi", () => {
    const yuborildi = vi.fn();
    render(<Sinov onSubmit={yuborildi} />);
    fireEvent.change(maydon(), { target: { value: "#bo" } });
    fireEvent.keyDown(maydon(), { key: "ArrowDown" });
    fireEvent.keyDown(maydon(), { key: "ArrowDown" });
    fireEvent.keyDown(maydon(), { key: "ArrowUp" });
    const faol = maydon().getAttribute("aria-activedescendant");
    expect(document.getElementById(faol ?? "")?.textContent).toBe(
      "#bozor",
    );
    expect(
      screen
        .getByRole("option", { name: "#bozor" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    fireEvent.keyDown(maydon(), { key: "Enter" });
    expect(maydon().value).toBe("#bozor");
    expect(maydon().getAttribute("aria-expanded")).toBe("false");
    expect(yuborildi).not.toHaveBeenCalled();
  });

  test("Esc — yopadi, qiymat joyida; sichqoncha bilan tanlash", () => {
    render(<Sinov onSubmit={() => {}} />);
    fireEvent.change(maydon(), { target: { value: "#u" } });
    fireEvent.keyDown(maydon(), { key: "Escape" });
    expect(maydon().getAttribute("aria-expanded")).toBe("false");
    expect(maydon().value).toBe("#u");
    fireEvent.change(maydon(), { target: { value: "#" } });
    fireEvent.click(screen.getByRole("option", { name: "#uy" }));
    expect(maydon().value).toBe("#uy");
  });
});
