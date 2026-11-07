// TajribaviySozlamalar.tsx — flaglarni shu brauzerda yoqish/o'chirish
// (21/#20). <details> ichida: oddiy foydalanuvchiga xalaqit bermasin
import { FLAGLAR } from "../flag-royxati.ts";
import type { FlagNomi } from "../flag-royxati.ts";
import { flagniQoy, useFlag } from "../flaglar.ts";

const NOMLAR: Readonly<Record<FlagNomi, string>> = {
  "teglar-grafigi": "Statistikada teglar grafigi",
  "ai-yordamchi": "AI yordamchi (sinov)",
};

function FlagKatagi({ nom }: { nom: FlagNomi }) {
  const yoqilgan = useFlag(nom);
  return (
    <p>
      <input
        type="checkbox"
        id={`flag-${nom}`}
        checked={yoqilgan}
        onChange={(event) => flagniQoy(nom, event.target.checked)}
      />{" "}
      <label htmlFor={`flag-${nom}`}>{NOMLAR[nom]}</label>
    </p>
  );
}

export function TajribaviySozlamalar() {
  return (
    <details id="tajribaviy">
      <summary>Tajribaviy imkoniyatlar</summary>
      {Object.keys(FLAGLAR).map((nom) => (
        <FlagKatagi key={nom} nom={nom as FlagNomi} />
      ))}
    </details>
  );
}
