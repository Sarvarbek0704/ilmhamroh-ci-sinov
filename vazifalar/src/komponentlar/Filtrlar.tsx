// Filtrlar.tsx — uch tugma, tanlangani aria-pressed="true"
import { FILTRLAR } from "../marshrut.ts";
import type { Filtr } from "../turlar.ts";

// Record<Filtr, string>: har filtrga matn — biri unutilsa, tsc aytadi
const NOMLAR: Readonly<Record<Filtr, string>> = Object.freeze({
  hammasi: "Hammasi",
  faol: "Faol",
  bajarilgan: "Bajarilgan",
});

type Props = {
  filtr: Filtr;
  onFiltr: (filtr: Filtr) => void;
};

export function Filtrlar({ filtr, onFiltr }: Props) {
  return (
    <div id="filtrlar" role="group" aria-label="Filtr">
      {FILTRLAR.map((f) => (
        <button
          key={f}
          type="button"
          data-filtr={f}
          aria-pressed={f === filtr}
          onClick={() => onFiltr(f)}
        >
          {NOMLAR[f]}
        </button>
      ))}
    </div>
  );
}
