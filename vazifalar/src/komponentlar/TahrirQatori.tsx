// TahrirQatori.tsx — tahrir paytidagi qator: maydon va ikki tugma
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AmalTugmasi } from "./AmalTugmasi.tsx";
import { Qator } from "./Qator.tsx";
import { Vazifa } from "../vazifa.ts";
import { useQatorAmallari } from "../kontekst/qator-amallari.ts";
import type { QatorJoyi, VazifaMalumoti } from "../turlar.ts";

// e2e ssenariy va CSS shu id bilan topadi
const TAHRIR_MAYDONI_ID = "tahrir-maydon";

type Props = {
  vazifa: VazifaMalumoti;
  joy?: QatorJoyi | undefined; // 18/#23: virtual ro'yxatda
};

export function TahrirQatori({ vazifa, joy }: Props) {
  const { onSaqla, onBekor } = useQatorAmallari(); // kontekstdan (17/#41)
  // Controlled (17/#18): maydondagi matn — state, maydon uni ko'rsatadi.
  // Fon yangilanganda (server, boshqa tab) qator key bilan saqlanadi —
  // yozilayotgan matn ham shu state'da qoladi. v6 da qator qayta
  // yasalardi va matnni qo'lda tiklardik (fondaChiz)
  const [matn, setMatn] = useState(vazifa.matn);
  // Saqlanmadi (bo'sh yoki takror) — maydon aria-invalid
  const [xatomi, setXatomi] = useState(false);
  // DOM elementiga havola (17/#34): React commit'dan keyin .current ga
  // <input> ni qo'yadi. v6 da document.getElementById edi
  const maydon = useRef<HTMLInputElement>(null);

  // Qator tahrirga o'tganda — fokus maydonga, matn belgilangan (yozish
  // uni almashtiradi). Effekt: DOM bilan sinxronlash, faqat birinchi
  // chizishda ([] — qator qayta chizilsa, belgilash buzilmaydi)
  useEffect(() => {
    maydon.current?.focus();
    maydon.current?.select();
  }, []);

  function saqla() {
    const xato = onSaqla(matn) !== null;
    setXatomi(xato);
    if (xato) {
      maydon.current?.focus(); // «Saqlash» bosilgan bo'lsa ham
    }
  }

  // Enter — saqlash, Esc — bekor. React hodisasi — SyntheticEvent:
  // brauzer hodisasining o'rami, asli — event.nativeEvent. IME (xitoy,
  // yapon yozuvi) tanlov oynasidagi Enter — saqlash emas (isComposing)
  function tugmaBosildi(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      saqla();
    } else if (event.key === "Escape") {
      onBekor();
    }
  }

  return (
    <Qator id={vazifa.id} joy={joy}>
      <input
        ref={maydon}
        id={TAHRIR_MAYDONI_ID}
        value={matn}
        onChange={(event) => setMatn(event.target.value)}
        aria-invalid={xatomi ? true : undefined}
        maxLength={Vazifa.MAKS_UZUNLIK}
        aria-label="Vazifa matni"
        onKeyDown={tugmaBosildi}
      />
      <AmalTugmasi
        amal="saqla"
        matn="Saqlash"
        nomi={vazifa.matn}
        onClick={saqla}
      />
      <AmalTugmasi
        amal="bekor"
        matn="Bekor qilish"
        nomi={vazifa.matn}
        onClick={onBekor}
      />
    </Qator>
  );
}
