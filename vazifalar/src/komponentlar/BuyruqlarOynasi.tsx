// BuyruqlarOynasi.tsx — command palette (20/#11): Ctrl+K (Mac'da ⌘K) yoki
// tugma → oyna, yozib qidirish, ↑/↓, Enter. Oyna — native <dialog> (13/#09
// dagi o'chirish oynasi kabi): fokus tuzog'i, Esc, fokus qaytishi —
// brauzerda. cmdk'ning Command.Dialog'i Radix Dialog — u CSP style-src
// 'self' ostida <style> qo'shadi (o'lchandi, natijalar/tajriba/
// kitlar-ishlat.txt: shadcn varianti) — ishlatilmaydi.
// Ichi (cmdk, BuyruqlarRoyxati.tsx) — KECHIKTIRILGAN yuklash: oynani
// hamma ham ochmaydi, cmdk esa har kimning birinchi yuklashiga tushardi.
// Bu faylda faqat tugma, yorliq va <dialog>.
// Tugma ustida tooltip (20/#10) — yorliqni ko'rsatadi
import { lazy, Suspense, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Search } from "lucide-react";
import { useNavigate } from "react-router";
import { useOynaHodisasi } from "@/hooklar/useOynaHodisasi.ts";
import { XatoChegarasi } from "@/komponentlar/XatoChegarasi.tsx";
import { Tugma } from "@/ui/Tugma.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/tooltip.tsx";

// Mac'da Cmd, qolganlarida Ctrl. navigator.platform eskirgan, lekin
// hamma brauzerda bor (userAgentData — faqat Chromium'da)
const MAC = /Mac|iPhone|iPad/.test(navigator.platform);
const YORLIQ = MAC ? "⌘K" : "Ctrl+K";

// Modul Promise'i bitta (StatistikaPaneli.tsx dagidek, 18/#09): oldindan
// yuklash va lazy() ikkalasi shuni kutadi
let modul: Promise<typeof import("./BuyruqlarRoyxati.tsx")> | null =
  null;
function modulniOl() {
  modul ??= import("./BuyruqlarRoyxati.tsx");
  return modul;
}
const BuyruqlarRoyxati = lazy(modulniOl);

// Sichqoncha tugma ustiga kelsa — bosishdan oldin yuklay boshlaymiz.
// Klaviatura fokusida EMAS: Tab bilan o'tib ketgan hamma yuklab olardi.
// Xato bu yerda jim — ochilganda chegara ko'rsatadi
function oldindanYukla() {
  modulniOl().catch(() => {});
}

export function BuyruqlarOynasi() {
  const oyna = useRef<HTMLDialogElement>(null);
  const [ochiq, setOchiq] = useState(false);
  const navigate = useNavigate();

  function och() {
    // flushSync: ichki qism showModal'dan OLDIN DOM'da bo'lsin (chunk
    // kelgan bo'lsa — maydon, kelmagan bo'lsa — "Yuklanmoqda…")
    flushSync(() => setOchiq(true));
    oyna.current?.showModal();
    // showModal fokusni birinchi fokuslanadigan elementga qo'yadi — cmdk
    // ildizida tabIndex={-1} bor, fokus qidiruv maydoniga emas, ildizga
    // tushardi (e2e-20 topdi: activeElement — div[cmdk-root]). Shuning
    // uchun — o'zimiz. Birinchi ochilishda maydon hali yo'q: u kelganda
    // fokusni o'zi oladi (BuyruqlarRoyxati)
    oyna.current?.querySelector("input")?.focus();
  }

  function bor(yol: string) {
    oyna.current?.close(); // fokus avval ochgan joyga qaytadi...
    void navigate(yol); // ...keyin Qobiq yangi sahifa sarlavhasiga qo'yadi
  }

  // Yorliq hamma joyda, maydon ichida ham ishlaydi: Ctrl+K matn yozmaydi.
  // preventDefault — brauzerning o'z Ctrl+K'si (manzil qatorida qidiruv).
  // code — jismoniy tugma (W-18): rus tartibida key "л", code baribir
  // "KeyK" (key bilan yorliq rus tartibida ishlamasdi — e2e-20)
  useOynaHodisasi("keydown", (event) => {
    if (
      (MAC ? event.metaKey : event.ctrlKey) &&
      event.code === "KeyK" &&
      !event.altKey &&
      !event.shiftKey
    ) {
      event.preventDefault();
      if (oyna.current?.open === true) {
        oyna.current.close();
      } else {
        och();
      }
    }
  });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Tugma
            id="buyruqlar-tugma"
            aria-haspopup="dialog"
            aria-keyshortcuts={MAC ? "Meta+K" : "Control+K"}
            onClick={och}
            onPointerEnter={oldindanYukla}
          >
            <Search size={16} />
            Buyruqlar
          </Tugma>
        </TooltipTrigger>
        <TooltipContent>{`Tezkor ochish: ${YORLIQ}`}</TooltipContent>
      </Tooltip>
      <dialog
        ref={oyna}
        id="buyruqlar"
        aria-label="Buyruqlar"
        className="w-[min(32rem,100%-2rem)]"
        onClose={() => setOchiq(false)}
      >
        {/* Yopiq oynada ro'yxat chizilmaydi: 1 000 vazifa bo'lsa ham
            ochilmaguncha ish yo'q. Chunk kelmasa — chegara xabari */}
        {ochiq && (
          <XatoChegarasi
            fallback={() => (
              <p role="alert">
                Buyruqlar oynasini yuklab bo'lmadi — sahifani yangilang.
              </p>
            )}
          >
            <Suspense fallback={<p role="status">Yuklanmoqda…</p>}>
              <BuyruqlarRoyxati bor={bor} />
            </Suspense>
          </XatoChegarasi>
        )}
      </dialog>
    </>
  );
}
