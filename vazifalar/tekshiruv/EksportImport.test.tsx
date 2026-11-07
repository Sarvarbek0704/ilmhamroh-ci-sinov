// EksportImport.test.tsx — eksport (controlled, readOnly) va import
// (uncontrolled + FormData, 17/#19)
import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Eksport } from "../src/komponentlar/Eksport.tsx";
import { Import } from "../src/komponentlar/Import.tsx";

describe("Eksport", () => {
  test("JSON maydonda paydo bo'ladi, belgilanadi", () => {
    render(
      <Eksport
        onJson={() => '{"versiya": 1}'}
        onFayl={vi.fn()}
        onCsv={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "JSON qilib chiqarish" }),
    );
    const maydon = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Vazifalar JSON ko'rinishida",
    });
    expect(maydon.value).toBe('{"versiya": 1}');
    expect(document.activeElement).toBe(maydon);
    expect(maydon.selectionEnd - maydon.selectionStart).toBe(14);
  });
});

describe("Import", () => {
  const maydon = () =>
    screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Eksport qilingan JSON matni",
    });

  test("FormData: maydondagi matn yuboriladi", () => {
    const onImport = vi.fn(() => null);
    render(<Import onImport={onImport} />);
    // Uncontrolled: qiymat DOM'da — state'siz
    maydon().value = '{"versiya": 1, "vazifalar": []}';
    fireEvent.click(
      screen.getByRole("button", { name: "Import qilish" }),
    );
    expect(onImport).toHaveBeenCalledWith(
      '{"versiya": 1, "vazifalar": []}',
    );
    expect(document.getElementById("import-xato")?.textContent).toBe(
      "",
    );
  });

  test("xato: matni ko'rinadi, matn maydoni belgilanadi, matn qoladi", () => {
    render(
      <Import onImport={() => "Versiya 2 o'qilmaydi — faqat 1."} />,
    );
    maydon().value = '{"versiya": 2}';
    fireEvent.click(
      screen.getByRole("button", { name: "Import qilish" }),
    );
    expect(document.getElementById("import-xato")?.textContent).toBe(
      "Versiya 2 o'qilmaydi — faqat 1.",
    );
    expect(maydon().getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(maydon());
    expect(maydon().value).toBe('{"versiya": 2}');
  });

  test("fayl: .json emas — o'qilmaydi, fayl maydoni belgilanadi", () => {
    const onImport = vi.fn(() => null);
    render(<Import onImport={onImport} />);
    const fayl = screen.getByLabelText<HTMLInputElement>(
      "Yoki eksport faylini tanlang (.json yoki .csv)",
    );
    fireEvent.change(fayl, {
      target: { files: [new File(["salom"], "vazifalar.txt")] },
    });
    expect(document.getElementById("import-xato")?.textContent).toBe(
      "Faqat .json yoki .csv fayl import qilinadi.",
    );
    expect(fayl.getAttribute("aria-invalid")).toBe("true");
    expect(maydon().hasAttribute("aria-invalid")).toBe(false);
    expect(onImport).not.toHaveBeenCalled();
  });
});
