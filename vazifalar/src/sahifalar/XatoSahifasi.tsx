// XatoSahifasi.tsx — marshrut xatosi (19/#02, errorElement): sahifa
// komponenti yoki (19/#05 dan) loader/action xato tashlasa, router
// sahifa o'rniga shuni chizadi. 18/#08 dagi XatoChegarasi — sahifa
// ICHIDAGI bo'lak uchun; bu — butun sahifa uchun
import {
  isRouteErrorResponse,
  Link,
  useRouteError,
} from "react-router";
import { xatoMatni } from "../server-sinxron.ts";

export function XatoSahifasi() {
  const xato = useRouteError();
  const matn = isRouteErrorResponse(xato)
    ? `${xato.status} — ${xato.statusText}`
    : xatoMatni(xato);
  return (
    <div id="sahifa-xato" role="alert">
      <title>Xato — Vazifalar</title>
      <h2>Sahifani ochib bo'lmadi</h2>
      <p>{matn}</p>
      <p>
        <Link to="/">Ro'yxatga qaytish</Link>
      </p>
    </div>
  );
}
