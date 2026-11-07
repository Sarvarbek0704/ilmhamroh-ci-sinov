// StatistikaSahifasi.tsx — "/statistika" (19/#02). 19/#13: ro'yxat —
// Query keshidan (ro'yxat sahifasi bilan bitta kesh): 19/#02 da
// localStorage'dan o'qilardi va server bilan hech solishtirilmasdi
// (o'lchandi: natijalar/11-sorovlar-oldin.txt — serverda 4, ekranda 3)
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Aloqa } from "../komponentlar/Aloqa.tsx";
import { VazifalarRoyxati } from "../royxat.ts";
import { useVazifalar } from "../server-sinxron.ts";
import { teglarMatni } from "../teglar.ts";
import { StatistikaPaneli } from "../xususiyatlar/statistika/index.ts";
import { useQobiq } from "./qobiq-konteksti.ts";

export function StatistikaSahifasi() {
  const { sarlavhaRef } = useQobiq();
  const { vazifalar, tarmoq, qaytaUrin } = useVazifalar();
  const { t } = useTranslation();
  const { qoldi, bajarildi, teglar } = useMemo(() => {
    const royxat = VazifalarRoyxati.dan(vazifalar);
    return { ...royxat.statistika(), teglar: royxat.tegHisobi() };
  }, [vazifalar]);
  const jami = qoldi + bajarildi;
  // 21/#03: foiz va sana — Intl orqali (i18next formatlari: tarjimada
  // {{ulush, number(style: percent)}}): "35%", ruscha "35 %" — har til o'z
  // qoidasi bilan. Sana — sahifa ochilgan vaqt (ma'lumot shu payt holati)
  const ulush = jami === 0 ? 0 : bajarildi / jami;
  const [vaqt] = useState(() => new Date());
  return (
    <>
      <title>
        {t("sahifaNomi", { sahifa: t("bolimlar.statistika") })}
      </title>
      <h2 ref={sarlavhaRef} tabIndex={-1}>
        {t("bolimlar.statistika")}
      </h2>
      <Aloqa tarmoq={tarmoq} onQaytaUrin={qaytaUrin} />
      <dl className="raqamlar">
        <div>
          <dt>{t("statistika.jami")}</dt>
          <dd>{jami}</dd>
        </div>
        <div>
          <dt>{t("statistika.qoldi")}</dt>
          <dd>{qoldi}</dd>
        </div>
        <div>
          <dt>{t("statistika.bajarildi")}</dt>
          <dd>{t("statistika.foiz", { bajarildi, ulush })}</dd>
        </div>
      </dl>
      <p id="hisobot-vaqti">{t("statistika.vaqt", { vaqt })}</p>
      <p>
        {teglar.size === 0
          ? t("statistika.tegYoq")
          : t("statistika.teglar", { royxat: teglarMatni(teglar) })}
      </p>
      <StatistikaPaneli vazifalar={vazifalar} />
    </>
  );
}
