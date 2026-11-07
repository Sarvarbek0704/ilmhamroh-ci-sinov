// VazifaXatosi.tsx — "/vazifa/:id" ning errorElement'i (19/#05): loader
// yoki action xato tashlasa — sahifa o'rnida. Qobiq (menyu) joyida
// qoladi: xato eng yaqin errorElement'ga ko'tariladi, bu esa shu marshrutniki
import {
  isRouteErrorResponse,
  Link,
  useRouteError,
} from "react-router";
import { xatoMatni } from "../server-sinxron.ts";
import { useQobiq } from "./qobiq-konteksti.ts";

export function VazifaXatosi() {
  const { sarlavhaRef } = useQobiq();
  const xato = useRouteError();
  const topilmadi = isRouteErrorResponse(xato) && xato.status === 404;
  const matn = isRouteErrorResponse(xato)
    ? String(xato.data)
    : xatoMatni(xato);
  return (
    <>
      <title>
        {topilmadi
          ? "Vazifa topilmadi — Vazifalar"
          : "Xato — Vazifalar"}
      </title>
      <h2 ref={sarlavhaRef} tabIndex={-1}>
        {topilmadi ? "Vazifa topilmadi" : "Vazifani ochib bo'lmadi"}
      </h2>
      <p id="vazifa-yoq">{matn}</p>
      <p>
        <Link to="/">Ro'yxatga qaytish</Link>
      </p>
    </>
  );
}
