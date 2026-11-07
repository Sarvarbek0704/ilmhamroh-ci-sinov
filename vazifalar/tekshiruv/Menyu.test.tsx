// Menyu.test.tsx — 20/#03: shadcn/ui DropdownMenu (Radix) — 18/#26–#30
// dagi o'z Menyu'miz o'rniga. Xuddi o'sha WAI-ARIA Menu Button xulqi
// endi kutubxonaniki: tekshiruvlar — bizga kerak bo'lgani (modal emas,
// aylanma, fokus qaytishi), Radix'ning ichki tafsiloti emas
import { describe, expect, test, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../src/ui/dropdown-menu.tsx";

function Namuna({
  onTanla = vi.fn(),
}: {
  onTanla?: (n: string) => void;
}) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>Yuklab olish</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onTanla("csv")}>
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onTanla("json")}>
            JSON
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onTanla("pdf")}>
            PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button>Tashqarida</button>
    </>
  );
}

const tugma = () =>
  screen.getByRole("button", { name: "Yuklab olish" });
const fokusda = () => document.activeElement?.textContent;
// Radix fokusni keyingi vazifada (setTimeout) qo'yadi — ochilganda ham,
// strelkalarda ham. Shuning uchun har tugmadan keyin kutamiz
const fokusKut = (matn: string) =>
  waitFor(() => expect(fokusda()).toBe(matn));

describe("Menyu (DropdownMenu)", () => {
  test("ARIA: yopiq — aria-expanded false, menyu yo'q; ↓ — ochiladi, fokus birinchi bandda", async () => {
    render(<Namuna />);
    expect(tugma().getAttribute("aria-haspopup")).toBe("menu");
    expect(tugma().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.keyDown(tugma(), { key: "ArrowDown" });
    expect(tugma().getAttribute("aria-expanded")).toBe("true");
    const menyu = screen.getByRole("menu");
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    await fokusKut("CSV");
    expect(menyu.getAttribute("aria-labelledby")).toBe(tugma().id);
    expect(menyu.id).toBe(tugma().getAttribute("aria-controls"));
  });

  test("strelkalar aylanadi (loop), Home/End, harf bilan qidirish", async () => {
    render(<Namuna />);
    fireEvent.keyDown(tugma(), { key: "Enter" });
    await fokusKut("CSV");
    const menyu = screen.getByRole("menu");
    const bos = (key: string) =>
      fireEvent.keyDown(document.activeElement ?? menyu, { key });
    bos("ArrowUp");
    await fokusKut("PDF"); // boshidan — oxiriga
    bos("ArrowDown");
    await fokusKut("CSV");
    bos("End");
    await fokusKut("PDF");
    bos("Home");
    await fokusKut("CSV");
    bos("j");
    await fokusKut("JSON");
  });

  test("Esc — yopiladi, fokus tugmaga qaytadi; band tanlansa — chaqiriladi va yopiladi", async () => {
    const onTanla = vi.fn();
    render(<Namuna onTanla={onTanla} />);
    fireEvent.keyDown(tugma(), { key: "Enter" });
    await fokusKut("CSV");
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    await waitFor(() => expect(document.activeElement).toBe(tugma()));
    expect(tugma().getAttribute("aria-expanded")).toBe("false");
    fireEvent.keyDown(tugma(), { key: "Enter" });
    await fokusKut("CSV");
    fireEvent.click(screen.getByRole("menuitem", { name: "JSON" }));
    expect(onTanla).toHaveBeenCalledWith("json");
    expect(tugma().getAttribute("aria-expanded")).toBe("false");
    await waitFor(() => expect(document.activeElement).toBe(tugma()));
  });

  test("modal emas: fon aria-hidden bo'lmaydi; tashqariga bosilsa — yopiladi", async () => {
    render(<Namuna />);
    fireEvent.keyDown(tugma(), { key: "Enter" });
    await fokusKut("CSV");
    // Modal menyu (Radix standarti) qolgan sahifani aria-hidden qilardi
    expect(
      screen.getByText("Tashqarida").closest("[aria-hidden]"),
    ).toBeNull();
    fireEvent.pointerDown(screen.getByText("Tashqarida"));
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(tugma().getAttribute("aria-expanded")).toBe("false");
  });
});
