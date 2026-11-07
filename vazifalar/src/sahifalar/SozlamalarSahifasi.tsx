// SozlamalarSahifasi.tsx — "/sozlamalar" (19/#02). 19/#22: foydalanuvchi
// sozlamalari — Zustand store'da (ilova-holati.ts), persist bilan
// localStorage'ga; ro'yxat sahifasi o'sha store'dan o'qiydi
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { TemaTanlov } from "../komponentlar/TemaTanlov.tsx";
import { TilTanlov } from "../komponentlar/TilTanlov.tsx";
import { MaxfiylikSozlamasi } from "../komponentlar/MaxfiylikSozlamasi.tsx";
import { TajribaviySozlamalar } from "../komponentlar/TajribaviySozlamalar.tsx";
import { Izoh } from "../komponentlar/Izoh.tsx";
import { useIlovaHolati } from "../ilova-holati.ts";
import { ProfilRasmi } from "../xususiyatlar/profil-rasmi/index.ts";
import { useQobiq } from "./qobiq-konteksti.ts";

export function SozlamalarSahifasi() {
  const { sarlavhaRef } = useQobiq();
  const sarlavhaId = useId();
  const ochirishdaSora = useIlovaHolati((h) => h.ochirishdaSora);
  const zichlik = useIlovaHolati((h) => h.zichlik);
  const setOchirishdaSora = useIlovaHolati((h) => h.setOchirishdaSora);
  const setZichlik = useIlovaHolati((h) => h.setZichlik);
  const { t } = useTranslation("sozlamalar");
  return (
    <>
      <title>
        {t("sahifaNomi", { ns: "umumiy", sahifa: t("sarlavha") })}
      </title>
      <h2 ref={sarlavhaRef} tabIndex={-1}>
        {t("sarlavha")}
      </h2>
      <section id="sozlamalar" aria-labelledby={sarlavhaId}>
        <h3 id={sarlavhaId}>{t("royxat")}</h3>
        <p>
          <input
            type="checkbox"
            id="ochirishda-sora"
            checked={ochirishdaSora}
            onChange={(event) =>
              setOchirishdaSora(event.target.checked)
            }
          />{" "}
          <label htmlFor="ochirishda-sora">{t("ochirishdaSora")}</label>
        </p>
        <p>
          <input
            type="checkbox"
            id="ixcham"
            checked={zichlik === "ixcham"}
            onChange={(event) =>
              setZichlik(event.target.checked ? "ixcham" : "oddiy")
            }
          />{" "}
          <label htmlFor="ixcham">{t("ixcham")}</label>
        </p>
      </section>
      <ProfilRasmi />
      <TemaTanlov />
      <TilTanlov />
      <MaxfiylikSozlamasi />
      <TajribaviySozlamalar />
      <Izoh />
    </>
  );
}
