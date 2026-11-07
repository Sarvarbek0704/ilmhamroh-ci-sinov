// VazifaSahifasi.tsx — "/vazifa/:id" (19/#03): bitta vazifa. Dinamik
// marshrut — :id manzildan, har vazifaga alohida komponent yozilmaydi.
// O'zi ham layout: ichidagi bo'limlar (ichma-ich marshrutlar) <Outlet />
// o'rnida, vazifa ularga kontekst bilan beriladi.
// 19/#05: vazifani loader oladi (vazifa-marshruti.ts) — komponent
// chizilganda u TAYYOR; topilmasa — errorElement (VazifaXatosi)
import { NavLink, Outlet, useLoaderData } from "react-router";
import { useOrqaga } from "../hooklar/useOrqaga.ts";
import { useVazifalar } from "../server-sinxron.ts";
import { useQobiq } from "./qobiq-konteksti.ts";
import type { vazifaLoader } from "./vazifa-marshruti.ts";
import type { VazifaKonteksti } from "./vazifa-konteksti.ts";

// «Orqaga» (19/#04): ilova ichidan kelingan bo'lsa — tarixda bir qadam
// (ro'yxat filtri, saralashi bilan), to'g'ridan ochilgan bo'lsa — ro'yxatga
function OrqagaTugmasi() {
  const orqaga = useOrqaga("/");
  return (
    <button type="button" id="orqaga" onClick={orqaga}>
      Orqaga
    </button>
  );
}

export function VazifaSahifasi() {
  const { sarlavhaRef } = useQobiq();
  // typeof vazifaLoader — tur loader'ning qaytargan qiymatidan
  const yuklangan = useLoaderData<typeof vazifaLoader>();
  // 19/#32: ekrandagi qiymat — Query keshidan (jonli), loader'niki —
  // faqat zaxira. Sabab (e2e topdi): /vazifa/1/tahrir dan Orqaga'da
  // ota marshrut ("vazifa/:id") joyida qoladi va router uning loader'ini
  // QAYTA chaqirmaydi (parametr o'zgarmagan) — loader ma'lumoti saqlashdan
  // oldingi bo'lib qolardi. Loader — "bormi, ochsa bo'ladimi" (404,
  // kirish); kesh — "hozir qanday"
  const { vazifalar } = useVazifalar();
  const vazifa =
    vazifalar.find((v) => v.id === yuklangan.id) ?? yuklangan;
  const kontekst: VazifaKonteksti = { sarlavhaRef, vazifa };
  return (
    <article id="vazifa" aria-labelledby="vazifa-sarlavha">
      <title>{`${vazifa.matn} — Vazifalar`}</title>
      <h2 id="vazifa-sarlavha" ref={sarlavhaRef} tabIndex={-1}>
        {vazifa.matn}
      </h2>
      {/* 19/#32: bo'limlar — umumiy va tahrir (ichma-ich marshrutlar) */}
      <nav className="ichki-bolimlar" aria-label="Vazifa bo'limlari">
        <ul>
          <li>
            <NavLink to="." end>
              Umumiy
            </NavLink>
          </li>
          <li>
            <NavLink to="tahrir">Tahrirlash</NavLink>
          </li>
        </ul>
      </nav>
      <Outlet context={kontekst} />
      <p>
        <OrqagaTugmasi />
      </p>
    </article>
  );
}
