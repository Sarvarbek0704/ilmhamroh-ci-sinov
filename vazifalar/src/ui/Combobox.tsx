// Combobox.tsx — maxsus input (19/#35): matn maydoni + takliflar ro'yxati,
// ARIA 1.2 combobox (APG: "list autocomplete, manual selection"). Fokus
// DOIM maydonda qoladi; ro'yxatdagi "faol" taklif — aria-activedescendant
// (ekran o'quvchi uni o'qiydi). Klaviatura: ↓/↑ — taklif, Enter — tanlash
// (forma yuborilmaydi), Esc — yopish, Tab — yopib keyingi elementga.
// 14/#41 dagi teg takliflari (tugmalar guruhi) — to'liq combobox emas edi
// (TEXNIK-QARZ 20): yangi formalar shu komponentni ishlatadi
import { useId, useState } from "react";
import type { KeyboardEvent, Ref } from "react";

type Props = {
  id: string;
  qiymat: string;
  onOzgar: (qiymat: string) => void;
  onBlur?: () => void;
  ref?: Ref<HTMLInputElement>;
  /** hamma variant — tartibi bilan (filtrlash shu yerda) */
  takliflar: readonly string[];
  placeholder?: string;
  "aria-invalid"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
};

const ENG_KOP = 8;

export function Combobox({
  id,
  qiymat,
  onOzgar,
  onBlur,
  ref,
  takliflar,
  placeholder,
  ...aria
}: Props) {
  const royxatId = useId();
  const [ochiq, setOchiq] = useState(false);
  const [faol, setFaol] = useState(-1); // -1 — hech biri
  const sorov = qiymat.trim().toLowerCase();
  const mos = takliflar
    .filter((t) => t.toLowerCase().startsWith(sorov) && t !== qiymat)
    .slice(0, ENG_KOP);
  const korinadi = ochiq && mos.length > 0;
  const variantId = (i: number) => `${royxatId}-${i}`;

  function tanla(taklif: string) {
    onOzgar(taklif);
    setOchiq(false);
    setFaol(-1);
  }

  function tugma(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) {
      return;
    }
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (mos.length === 0) {
          return;
        }
        setOchiq(true);
        const qadam = event.key === "ArrowDown" ? 1 : -1;
        setFaol((f) => (f + qadam + mos.length) % mos.length);
        return;
      }
      case "Enter": {
        const tanlangan = korinadi ? mos[faol] : undefined;
        if (tanlangan !== undefined) {
          event.preventDefault(); // formani yubormasin — faqat tanlash
          tanla(tanlangan);
        }
        return;
      }
      case "Escape":
        if (korinadi) {
          event.preventDefault();
          setOchiq(false);
          setFaol(-1);
        }
        return;
      default:
    }
  }

  return (
    <span className="combobox">
      <input
        ref={ref}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-expanded={korinadi}
        aria-controls={royxatId}
        aria-activedescendant={
          korinadi && faol >= 0 ? variantId(faol) : undefined
        }
        value={qiymat}
        onChange={(event) => {
          onOzgar(event.target.value);
          setOchiq(true);
          setFaol(-1);
        }}
        onKeyDown={tugma}
        onBlur={() => {
          setOchiq(false);
          setFaol(-1);
          onBlur?.();
        }}
        {...aria}
      />
      <ul id={royxatId} role="listbox" hidden={!korinadi}>
        {mos.map((taklif, i) => (
          <li
            key={taklif}
            id={variantId(i)}
            role="option"
            aria-selected={i === faol}
            // mousedown'da fokus maydondan ketmasin (blur ro'yxatni yopardi)
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => tanla(taklif)}
          >
            {taklif}
          </li>
        ))}
      </ul>
    </span>
  );
}
