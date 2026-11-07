// tema-tanlash.ts — tema: tizim, yorug' yoki qorong'i
import { temaniOl } from "./saqlash.ts";

export type Tema = "tizim" | "yorug" | "qorongi";
type KorinadiganTema = Exclude<Tema, "tizim">;

export const TEMALAR: readonly Tema[] = Object.freeze([
  "tizim",
  "yorug",
  "qorongi",
]);

// Telefon brauzeri paneli (theme-color) — fon rangi bilan bir xil
const PANEL_RANGLARI: Readonly<Record<KorinadiganTema, string>> =
  Object.freeze({
    yorug: "#f7faf8",
    qorongi: "#14201a",
  });

// Xotiradagi qiymat qo'lda o'zgartirilgan bo'lishi mumkin
export function tanlovniOl(qiymat: string | null): Tema {
  return TEMALAR.find((tema) => tema === qiymat) ?? "tizim";
}

// Ekranda qaysi tema ko'rinadi: "tizim" — tizim sozlamasiga qarab
export function korinadiganTema(
  tanlov: Tema,
  tizimQorongimi: boolean,
): KorinadiganTema {
  if (tanlov !== "tizim") {
    return tanlov;
  }
  return tizimQorongimi ? "qorongi" : "yorug";
}

// Tizim sozlamasi — CSS media so'rovi (17/#44: useMediaQuery)
export const TIZIM_QORONGI = "(prefers-color-scheme: dark)";

// Tanlovni sahifaga qo'llaydi: <html data-tema> (ranglarni CSS
// almashtiradi) va telefon paneli rangi (theme-color — JS ishi). Bu
// React'dan tashqaridagi DOM: TemaKonteksti effekt ichida chaqiradi
export function temaniQolla(tanlov: Tema, tizimQorongi: boolean): void {
  const html = document.documentElement;
  if (tanlov === "tizim") {
    delete html.dataset.tema;
  } else {
    html.dataset.tema = tanlov;
  }
  const panel = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (panel !== null) {
    panel.content =
      PANEL_RANGLARI[korinadiganTema(tanlov, tizimQorongi)];
  }
}

export function saqlanganTanlov(): Tema {
  return tanlovniOl(temaniOl());
}
