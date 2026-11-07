// IzohKorinishi.tsx — izoh Markdown'dan React elementlariga (21/#08).
// Alohida chunk (VazifaIzohi'da lazy): react-markdown + remark-gfm
// ~ +NN KB gzip — faqat izohi bor vazifa sahifasida yuklanadi.
// XAVFSIZLIK: react-markdown HTML satr yasamaydi (dangerouslySetInnerHTML
// yo'q — Trusted Types siyosati o'zgarmaydi). Qo'shimcha:
//  - skipHtml: Markdown ichidagi xom HTML (<img onerror=…>, <script>)
//    umuman chizilmaydi (matn sifatida ham)
//  - urlTransform (standart): javascript:, data: … havolalar bo'shatiladi
//  - rasm yo'q: tashqi rasm — kuzatish pikseli va CSP (img-src 'self')
//    buzilishi; o'rnida alt matni ([rasm]) qoladi
//  - havolalar yangi tabda, rel="noopener noreferrer nofollow"
import Markdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const KOMPONENTLAR: Components = {
  // GFM "- [x] …" — o'qish uchun katak (o'zgarmaydi): axe "label" (21/#08
  // a11y o'lchovi topdi) — nomsiz katak; holati nomda
  input: ({ type, checked }) =>
    type === "checkbox" ? (
      <input
        type="checkbox"
        checked={checked ?? false}
        disabled
        aria-label={checked ? "bajarilgan" : "bajarilmagan"}
      />
    ) : null,
  img: ({ alt }) => <span className="izoh-rasm">[{alt}]</span>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ),
};

export default function IzohKorinishi({ matn }: { matn: string }) {
  return (
    <div className="izoh-matni">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={KOMPONENTLAR}
      >
        {matn}
      </Markdown>
    </div>
  );
}
