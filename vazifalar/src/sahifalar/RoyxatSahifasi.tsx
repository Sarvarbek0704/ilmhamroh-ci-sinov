// RoyxatSahifasi.tsx — "/" (19/#02): vazifalar ro'yxati — 18-qismdagi
// butun ilova (App). Sahifa har ochilganda (boshqa sahifadan qaytilsa
// ham) App qayta o'rnatiladi: ro'yxat va qoralama o'sha paytdagi
// xotiradan (lazy init — bir marta, mount'da). 18/#42 da bu main.tsx
// dagi Ilova edi
import { useState } from "react";
import { App } from "../App.tsx";
import { boshlangichVazifalar } from "../holat.ts";
import { qoralamaniOl, yukla } from "../saqlash.ts";
import { useQobiq } from "./qobiq-konteksti.ts";

export function RoyxatSahifasi() {
  const { sarlavhaRef } = useQobiq();
  const [boshlangich] = useState(() => ({
    royxat: yukla() ?? boshlangichVazifalar,
    qoralama: qoralamaniOl(),
  }));
  return (
    <App
      boshlangichRoyxat={boshlangich.royxat}
      qoralama={boshlangich.qoralama}
      sarlavhaRef={sarlavhaRef}
    />
  );
}
