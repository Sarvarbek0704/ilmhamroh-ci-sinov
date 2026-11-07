// Qobiq.tsx — layout marshrut (19/#02): hamma sahifaning umumiy qismi.
// Bolalar (ro'yxat, statistika, sozlamalar...) <Outlet /> o'rnida
// chiziladi; sahifa almashganda Qobiq qayta o'rnatilmaydi (holati,
// foydalanuvchi menyusi joyida qoladi)
import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useMatch } from "react-router";
import { useTranslation } from "react-i18next";
import { useFlag } from "../flaglar.ts";
import { useTarixQadami } from "../hooklar/useTarixQadami.ts";
import { Bildirishnoma } from "../komponentlar/Bildirishnoma.tsx";
import { useElon } from "../hooklar/useElon.ts";
import { useJonliYangilanish } from "../jonli.ts";
import { NonYoli } from "./NonYoli.tsx";
import { YangilanishTaklifi } from "../komponentlar/YangilanishTaklifi.tsx";
import { SeoTeglari } from "../komponentlar/SeoTeglari.tsx";
import { BuyruqlarOynasi } from "../komponentlar/BuyruqlarOynasi.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { HarakatSozlamasi } from "../ui/HarakatSozlamasi.tsx";
import {
  FoydalanuvchiMenyusi,
  useAuth,
} from "../xususiyatlar/auth/index.ts";
import type { QobiqKonteksti } from "./qobiq-konteksti.ts";

export function Qobiq() {
  // Har sahifaning asosiy sarlavhasi shu ref'ga ulanadi (Outlet
  // konteksti): skip link fokusni unga qo'yadi
  const sarlavhaRef = useRef<HTMLHeadingElement>(null);
  const royxatda = useMatch("/") !== null;
  // 19/#07: kirmagan — bo'limlar menyusi yo'q (hammasi himoyalangan)
  const kirgan = useAuth().foydalanuvchi !== null;
  const kontekst: QobiqKonteksti = { sarlavhaRef };
  // 19/#04: ilova ichidagi tarix chuqurligi — «Orqaga» uchun
  useTarixQadami();
  // 19/#18: boshqa qurilmadagi o'zgarish — dev'da (SSE), hamma sahifada
  useJonliYangilanish();
  // 19/#21: e'lon — hamma sahifada (store'dan); ro'yxat sahifasidan
  // tashqarida ham: masalan vazifa sahifasida o'chirilgach ro'yxatda
  const [elon] = useElon();
  // 21/#02: matnlar — tarjima faylidan (i18n/<til>/umumiy.json)
  const { t } = useTranslation();
  // 21/#26: yordamchi — flag yoqilgan VA build'da manzil bor bo'lsa
  const yordamchi =
    useFlag("ai-yordamchi") &&
    import.meta.env.VITE_AI_URL !== undefined;

  // 19/#10: sahifa almashdi — fokus yangi sahifa sarlavhasiga. Aks holda
  // fokus bosilgan havola bilan birga yo'qoladi (<body> ga tushadi):
  // ekran o'quvchi yangi sahifani eshitmaydi, Tab boshidan boshlanadi.
  // Faqat yo'l o'zgarganda (filtr — o'sha sahifa) va birinchi ochilishda
  // emas. preventScroll — aylantirilgan joyga tegmaymiz: Orqaga'da
  // brauzer o'zi tiklaydi (o'lchandi, natijalar/10-aylantirish.txt —
  // ro'yxat keshdan sinxron chiziladi, <ScrollRestoration> kerak bo'lmadi)
  const { pathname } = useLocation();
  const oldingiYol = useRef(pathname);
  useEffect(() => {
    if (oldingiYol.current !== pathname) {
      // Kirishdan keyin — fokusni foydalanuvchi menyusi o'zi qo'yadi
      // (18/#42: "Malika" tugmasi — kim kirgani eshitiladi)
      const kirishdan = oldingiYol.current === "/kirish";
      oldingiYol.current = pathname;
      if (!kirishdan) {
        sarlavhaRef.current?.focus({ preventScroll: true });
      }
    }
  }, [pathname]);
  return (
    // 20/#23–#26: Motion (LazyMotion + MotionConfig) — butun ilova uchun
    <HarakatSozlamasi>
      {/* Skip link (18/#40) — endi layout'da, birinchi Tab: sahifalar
          menyusi va foydalanuvchi tugmasidan oldin. preventDefault:
          #royxat URL'ga yozilmasin */}
      {/* 19/#07: kirmagan — o'tadigan joy yo'q (faqat kirish formasi) */}
      {kirgan && (
        <a
          // 21/#02 (axe "skip-link", sozlamalar sahifasida topildi): #royxat
          // faqat ro'yxat sahifasida bor — boshqa sahifada havola yo'q joyga
          // ko'rsatardi. Endi — React ildizi #ilova (har doim bor; fokusni
          // baribir onClick sarlavhaga qo'yadi). O'rovchi <div id="sahifa">
          // sinaldi — e2e-19 dagi virtual ro'yxat bosishini buzdi, olib tashlandi
          href={royxatda ? "#royxat" : "#ilova"}
          className="otish"
          onClick={(event) => {
            event.preventDefault();
            sarlavhaRef.current?.focus();
          }}
        >
          {royxatda ? t("otish.royxat") : t("otish.asosiy")}
        </a>
      )}
      {/* 19/#10: viewTransition — sahifa almashishi
          document.startViewTransition ichida (CSS: qisqa o'tish,
          prefers-reduced-motion'da yo'q). Faqat bo'limlar menyusida
          NavLink — joriy sahifa havolasiga aria-current="page" qo'yadi
          (ekran o'quvchi "joriy sahifa" deydi, CSS shu atributga
          qaraydi). end — "/" faqat aynan ro'yxat sahifasida joriy */}
      {kirgan && (
        <nav className="bolimlar" aria-label={t("bolimlar.nomi")}>
          <ul>
            <li>
              <NavLink to="/" end viewTransition>
                {t("bolimlar.royxat")}
              </NavLink>
            </li>
            <li>
              <NavLink to="/statistika" viewTransition>
                {t("bolimlar.statistika")}
              </NavLink>
            </li>
            {yordamchi && (
              <li>
                <NavLink to="/yordamchi" viewTransition>
                  {t("bolimlar.yordamchi")}
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to="/sozlamalar" viewTransition>
                {t("bolimlar.sozlamalar")}
              </NavLink>
            </li>
          </ul>
        </nav>
      )}
      {/* 20/#10–#11: buyruqlar oynasi (Ctrl+K) va foydalanuvchi menyusi
          bir qatorda. TooltipProvider — tooltip'lar uchun umumiy kechikish */}
      <TooltipProvider>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {kirgan && <BuyruqlarOynasi />}
          <FoydalanuvchiMenyusi />
        </div>
      </TooltipProvider>
      {/* 21/#32: canonical va hreflang — <head> ga */}
      <SeoTeglari />
      {/* 21/#28: yangi versiya tayyor — «Yangilash» */}
      <YangilanishTaklifi />
      {kirgan && <NonYoli />}
      <Outlet context={kontekst} />
      <Bildirishnoma matn={elon} />
    </HarakatSozlamasi>
  );
}
