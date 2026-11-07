// TemaTanlov.tsx — tizim / yorug' / qorong'i (13/#05). 17/#24 da
// React'ga ko'chdi (controlled radio), 17/#42 dan tanlov — kontekstda
import { Fragment } from "react";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useTema } from "../kontekst/TemaKonteksti.tsx";
import { TEMALAR, tanlovniOl } from "../tema-tanlash.ts";

export function TemaTanlov() {
  // Tanlov — kontekstdan (17/#42): state endi TemaProvider'da
  const { tanlov, tanla } = useTema();
  // 21/#02: nomlar — "sozlamalar" namespace'idan (tema.tizim ...)
  const { t } = useTranslation("sozlamalar");

  function tanlandi(event: ChangeEvent<HTMLInputElement>) {
    tanla(tanlovniOl(event.target.value));
  }
  // v6 da fieldset index.html da hidden edi va JS uni ochardi (JS
  // ishlamasa — tugmalar ko'rinmasin). Endi uni React chizadi: JS yo'q
  // bo'lsa, umuman yo'q
  return (
    <fieldset id="tema-tanlov">
      <legend>{t("tema.nomi")}</legend>
      {TEMALAR.map((tema) => (
        <Fragment key={tema}>
          <input
            type="radio"
            name="tema"
            id={`tema-${tema}`}
            value={tema}
            checked={tanlov === tema}
            onChange={tanlandi}
          />
          <label htmlFor={`tema-${tema}`}>{t(`tema.${tema}`)}</label>
        </Fragment>
      ))}
    </fieldset>
  );
}
