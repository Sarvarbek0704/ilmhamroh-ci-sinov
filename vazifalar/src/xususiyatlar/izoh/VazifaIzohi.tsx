// VazifaIzohi.tsx — vazifa sahifasidagi izoh (21/#08): Markdown bilan
// yoziladi, ko'rinishda — formatlangan. Tahrir — oddiy <textarea> (rich
// text muharrir emas: #10–#11 o'lchovi — Tiptap/Lexical bitta maydon
// uchun ortiqcha). Markdown chizuvchi — kech chunk; kelguncha xom matn
import { lazy, Suspense, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Tugma } from "../../ui/Tugma.tsx";
import { IZOH_MAKS, useIzohlar } from "./izoh-holati.ts";

const IzohKorinishi = lazy(() => import("./IzohKorinishi.tsx"));

export function VazifaIzohi({ id }: { id: number }) {
  const sarlavhaId = useId();
  const izoh = useIzohlar((h) => h.izohlar[String(id)] ?? "");
  const izohniYoz = useIzohlar((h) => h.izohniYoz);
  const [tahrir, setTahrir] = useState<string | null>(null);
  const tahrirTugmasi = useRef<HTMLButtonElement>(null);

  // Forma yopiladi — fokus u bilan yo'qolardi (<body> ga; e2e topdi).
  // flushSync: tugma DOM'ga qaytgach darhol unga fokus
  function yop() {
    flushSync(() => setTahrir(null));
    tahrirTugmasi.current?.focus();
  }

  function saqla() {
    if (tahrir !== null) {
      izohniYoz(id, tahrir);
    }
    yop();
  }

  return (
    <section id="vazifa-izohi" aria-labelledby={sarlavhaId}>
      <h3 id={sarlavhaId}>Izoh</h3>
      {tahrir === null ? (
        <>
          {izoh === "" ? (
            <p className="izoh">Izoh yo'q.</p>
          ) : (
            // Kelguncha — xom matn (bo'sh joy saqlanadi): sakrash kam
            <Suspense fallback={<p className="izoh-xom">{izoh}</p>}>
              <IzohKorinishi matn={izoh} />
            </Suspense>
          )}
          <Tugma
            id="izoh-tahrirla"
            ref={tahrirTugmasi}
            onClick={() => setTahrir(izoh)}
          >
            {izoh === "" ? "Izoh qo'shish" : "Izohni tahrirlash"}
          </Tugma>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saqla();
          }}
        >
          <p>
            <label htmlFor="izoh-matn">Izoh (Markdown)</label>
            <textarea
              id="izoh-matn"
              rows={6}
              maxLength={IZOH_MAKS}
              value={tahrir}
              aria-describedby="izoh-yordam"
              autoFocus
              onChange={(event) => setTahrir(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  yop();
                }
              }}
            />
            <small id="izoh-yordam">
              **qalin**, _kursiv_, `kod`, - ro'yxat, - [ ] vazifa,
              [havola](https://…). HTML va rasm ko'rsatilmaydi.
            </small>
          </p>
          <p className="qator">
            <Tugma type="submit" variant="asosiy" id="izoh-saqla">
              Saqlash
            </Tugma>
            <Tugma onClick={yop}>Bekor qilish</Tugma>
          </p>
        </form>
      )}
    </section>
  );
}
