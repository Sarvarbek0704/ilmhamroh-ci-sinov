// Himoyalangan.tsx — himoyalangan marshrutlar (18/#42 da komponent edi,
// 19/#07 dan — marshrut elementi): kirmagan bo'lsa — /kirish ga
// (qaytish manzili ?keyin= da), kirgan bo'lsa — bola marshrut (Outlet).
// Chiqilsa (shu yoki boshqa tabda) — darhol /kirish: sahifa o'chiriladi
// (unmount), effektlar tozalanadi.
// ESLATMA: bu faqat KO'RINISHni yashiradi. Ma'lumot (localStorage,
// bundle) brauzerda baribir bor; loader esa komponentdan OLDIN ishlaydi —
// u o'zi tekshiradi (vazifa-marshruti.ts). Haqiqiy himoya — serverda
// (28-qism: har so'rovda sessiya)
import {
  Navigate,
  Outlet,
  useLocation,
  useOutletContext,
} from "react-router";
import { useAuth } from "./AuthKonteksti.tsx";
import { KirishFormasi } from "./KirishFormasi.tsx";

/** /kirish?keyin=<hozirgi yo'l> */
export function kirishManzili(yol: string): string {
  return `/kirish?${new URLSearchParams({ keyin: yol }).toString()}`;
}

export function Himoyalangan() {
  const { foydalanuvchi } = useAuth();
  const { pathname, search } = useLocation();
  // Layout (Qobiq) konteksti shu marshrut orqali bolalarga o'tadi:
  // Outlet konteksti faqat bevosita bolaga yetadi
  const kontekst = useOutletContext();
  if (foydalanuvchi === null) {
    // replace: Orqaga himoyalangan sahifaga qaytib, yana shu yerga
    // otilmasin. <Navigate> manzilni EFFEKTDA almashtiradi — birinchi
    // kadr bo'sh qolardi (o'lchandi: sahifa yuklanganda forma yo'q edi);
    // forma shu kadrdayoq ko'rinsin
    return (
      <>
        <Navigate to={kirishManzili(pathname + search)} replace />
        <KirishFormasi />
      </>
    );
  }
  return <Outlet context={kontekst} />;
}
