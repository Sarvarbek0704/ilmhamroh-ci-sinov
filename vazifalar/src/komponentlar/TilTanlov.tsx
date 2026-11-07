// TilTanlov.tsx — interfeys tili (21/#02). TemaTanlov kabi radio guruh:
// tanlov ko'rinib turadi, bitta Tab bilan kiriladi, ↑↓ bilan almashadi.
// 21/#03: tanlash — boshqa til manziliga o'tish (sahifa qayta yuklanadi)
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import {
  TIL_NOMLARI,
  TILLAR,
  tilmi,
  tilniAlmashtir,
} from "../i18n/index.ts";

export function TilTanlov() {
  // i18n — hook qaytaradigan nusxa: til o'zgarsa komponent qayta chiziladi
  const { t, i18n } = useTranslation("sozlamalar");
  return (
    <fieldset id="til-tanlov" aria-describedby="til-izoh">
      <legend>{t("til.nomi")}</legend>
      <p id="til-izoh" className="izoh">
        {t("til.izoh")}
      </p>
      {TILLAR.map((til) => (
        <Fragment key={til}>
          <input
            type="radio"
            name="til"
            id={`til-${til}`}
            value={til}
            checked={i18n.resolvedLanguage === til}
            onChange={(event) => {
              const tanlangan = event.target.value;
              if (tilmi(tanlangan)) {
                tilniAlmashtir(tanlangan);
              }
            }}
          />
          {/* lang — til nomi o'z tilida o'qilsin ("Русский" ruscha) */}
          <label htmlFor={`til-${til}`} lang={til}>
            {TIL_NOMLARI[til]}
          </label>
        </Fragment>
      ))}
    </fieldset>
  );
}
