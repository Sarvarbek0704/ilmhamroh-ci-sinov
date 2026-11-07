// MaxfiylikSozlamasi.tsx — «Anonim statistika» (21/#18). Analitika
// sukut bo'yicha yoqilgan (shaxssiz, cookie'siz), lekin o'chirish bir
// bosishda; brauzer GPC/DNT yuborsa — o'chiq va tugma ham faol emas
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  analitikaniSozla,
  analitikaYoqilganmi,
} from "../kuzatuv/analitika.ts";
import { kuzatmaslikSoralgan } from "../kuzatuv/maxfiylik.ts";

export function MaxfiylikSozlamasi() {
  const { t } = useTranslation("sozlamalar");
  const sarlavhaId = useId();
  const gpc = kuzatmaslikSoralgan(navigator);
  const [yoqilgan, setYoqilgan] = useState(analitikaYoqilganmi);
  return (
    <section id="maxfiylik" aria-labelledby={sarlavhaId}>
      <h3 id={sarlavhaId}>{t("maxfiylik.sarlavha")}</h3>
      <p>
        <input
          type="checkbox"
          id="analitika"
          checked={yoqilgan}
          disabled={gpc}
          aria-describedby="analitika-izoh"
          onChange={(event) => {
            analitikaniSozla(event.target.checked);
            setYoqilgan(event.target.checked);
          }}
        />{" "}
        <label htmlFor="analitika">{t("maxfiylik.analitika")}</label>
      </p>
      <p id="analitika-izoh" className="izoh">
        {gpc ? t("maxfiylik.gpc") : t("maxfiylik.izoh")}
      </p>
    </section>
  );
}
