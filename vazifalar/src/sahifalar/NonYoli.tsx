// NonYoli.tsx — breadcrumb (19/#10): mos kelgan marshrutlar zanjiridan
// (useMatches). Har marshrut o'z bo'lagini handle.nonYoli da aytadi —
// Qobiq marshrutlarni BILMAYDI. Faqat ichkariroq sahifada (2+ bo'lak)
import { Link, useMatches } from "react-router";
import type { UIMatch } from "react-router";

/** marshrutlar.tsx dagi handle shakli */
export type NonYoliHandle = {
  /** loader ma'lumotidan (bo'lsa) bo'lak nomi */
  nonYoli: (malumot: unknown) => string;
};

function nonYolimi(handle: unknown): handle is NonYoliHandle {
  return (
    typeof handle === "object" &&
    handle !== null &&
    "nonYoli" in handle &&
    typeof handle.nonYoli === "function"
  );
}

export function NonYoli() {
  const bolaklar = useMatches().flatMap((m: UIMatch) =>
    nonYolimi(m.handle)
      ? [{ yol: m.pathname, nomi: m.handle.nonYoli(m.loaderData) }]
      : [],
  );
  if (bolaklar.length < 2) {
    return null;
  }
  return (
    <nav className="non-yoli" aria-label="Non yo'li">
      <ol>
        {bolaklar.map((b, i) => (
          <li key={b.yol}>
            {i === bolaklar.length - 1 ? (
              <span aria-current="page">{b.nomi}</span>
            ) : (
              <Link to={b.yol}>{b.nomi}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
