// TopilmadiSahifasi.tsx — "*" (19/#02): hech bir marshrutga mos
// kelmagan manzil. Server (GitHub Pages) bunday manzilga 404.html ni
// beradi, sahifani esa shu marshrut ko'rsatadi
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useQobiq } from "./qobiq-konteksti.ts";

export function TopilmadiSahifasi() {
  const { sarlavhaRef } = useQobiq();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  return (
    <>
      <title>
        {t("sahifaNomi", { sahifa: t("topilmadi.sarlavha") })}
      </title>
      {/* 21/#32: SPA zaxirasi (Vercel rewrites) 404 manzilga ham 200
          beradi — "soft 404": qidiruv tizimi indekslamasin */}
      <meta name="robots" content="noindex" />
      <h2 ref={sarlavhaRef} tabIndex={-1}>
        {t("topilmadi.sarlavha")}
      </h2>
      <p id="topilmadi">{t("topilmadi.matn", { yol: pathname })}</p>
      <p>
        <Link to="/">{t("topilmadi.qaytish")}</Link>
      </p>
    </>
  );
}
