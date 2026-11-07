// SeoTeglari.tsx — har sahifada <head> ga (React 19 <link>/<meta> ni o'zi
// ko'taradi, 18/#12): canonical va har til uchun hreflang (21/#32).
// Qidiruv tizimi /ru/statistika va /statistika ni bitta sahifaning ikki
// tili deb tushunadi (dublikat emas). Manzil — so'rovsiz (?filtr=… —
// o'sha sahifa). Halol cheklov: bu teglar JS bajarilgandan keyin bor —
// JS'siz o'quvchilar (Telegram/WhatsApp havola ko'rinishi) faqat
// index.html dagi statik og:* teglarni ko'radi (QADAMLAR #32)
import { useLocation } from "react-router";
import { TILLAR } from "../i18n/index.ts";
import { tildaYol } from "../i18n/yol.ts";

export function SeoTeglari() {
  // pathname — basename'siz; to'liq yo'l — brauzer manzilidan
  useLocation();
  const toliq = (til: (typeof TILLAR)[number]) =>
    new URL(
      tildaYol(location.pathname, "", til, import.meta.env.BASE_URL),
      location.origin,
    ).href;
  return (
    <>
      <link
        rel="canonical"
        href={new URL(location.pathname, location.origin).href}
      />
      {TILLAR.map((til) => (
        <link
          key={til}
          rel="alternate"
          hrefLang={til}
          href={toliq(til)}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={toliq("uz")} />
    </>
  );
}
