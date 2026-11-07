// YordamchiSahifasi.tsx — "/yordamchi": AI chat, oqimli javob (21/#26).
// Javob so'zma-so'z keladi (fetch + ReadableStream, oqim.ts) va shu zahoti
// chiziladi. UI naqshlari: «To'xtatish» (AbortController), «Qayta yaratish»
// (oxirgi savol qayta), pastga avto-aylantirish (faqat foydalanuvchi pastda
// bo'lsa — yuqoriga o'qiyotganni sudramaymiz), ekran o'quvchiga — har so'z
// emas, faqat tayyor javob (role="status"). Markdown — izoh chizuvchisi
// (kech chunk). Manzil — VITE_AI_URL (dev: soxta oqim, skriptlar/ai-soxta.js);
// API kalit HECH QACHON brauzerda emas — server (25/31-qism) modelga so'raydi.
// Vercel AI SDK (@ai-sdk/react useChat) o'lchandi: +44.1 KB va Trusted
// Types'da TrustedScript buzilishi (natijalar/tajriba/kutubxonalar-21.txt)
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { Tugma } from "../../ui/Tugma.tsx";
import { MarkdownMatn } from "../izoh/index.ts";
import { useQobiq } from "../../sahifalar/qobiq-konteksti.ts";
import { sseHodisalari } from "./oqim.ts";

const MANZIL = import.meta.env.VITE_AI_URL;

type Xabar = {
  readonly id: number;
  readonly rol: "foydalanuvchi" | "yordamchi";
  readonly matn: string;
  readonly holat: "tayyor" | "yozmoqda" | "toxtatildi" | "xato";
};

export function YordamchiSahifasi() {
  const { sarlavhaRef } = useQobiq();
  const maydonId = useId();
  const [xabarlar, setXabarlar] = useState<readonly Xabar[]>([]);
  const [elon, setElon] = useState("");
  const pult = useRef<AbortController | null>(null);
  const royxat = useRef<HTMLOListElement>(null);
  const pastdami = useRef(true);
  const maydon = useRef<HTMLTextAreaElement>(null);
  const yozmoqda = xabarlar.at(-1)?.holat === "yozmoqda";

  // Har yangi bo'lakdan keyin: foydalanuvchi pastda bo'lsa — pastga
  useEffect(() => {
    if (pastdami.current) {
      royxat.current?.lastElementChild?.scrollIntoView({
        block: "end",
      });
    }
  }, [xabarlar]);
  useEffect(() => {
    const kuzat = () => {
      pastdami.current =
        innerHeight + scrollY >=
        document.documentElement.scrollHeight - 40;
    };
    addEventListener("scroll", kuzat, { passive: true });
    return () => removeEventListener("scroll", kuzat);
  }, []);
  // Sahifadan chiqildi — yo'ldagi javob to'xtasin
  useEffect(() => () => pult.current?.abort(), []);

  function oxirgisiniYangila(o: (x: Xabar) => Partial<Xabar>) {
    setXabarlar((eski) =>
      eski.map((x, i) =>
        i === eski.length - 1 ? { ...x, ...o(x) } : x,
      ),
    );
  }

  async function sora(tarix: readonly Xabar[]) {
    if (MANZIL === undefined) {
      return;
    }
    const yangiPult = new AbortController();
    pult.current = yangiPult;
    setElon("");
    setXabarlar([
      ...tarix,
      {
        id: tarix.length + 1,
        rol: "yordamchi",
        matn: "",
        holat: "yozmoqda",
      },
    ]);
    try {
      const javob = await fetch(MANZIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xabarlar: tarix.map(({ rol, matn }) => ({ rol, matn })),
        }),
        signal: yangiPult.signal,
      });
      if (!javob.ok || javob.body === null) {
        throw new Error(`Server javobi: ${javob.status}`);
      }
      for await (const h of sseHodisalari(javob.body)) {
        if (h.tur === "tugadi") {
          break;
        }
        const bolak = (JSON.parse(h.malumot) as { matn: string }).matn;
        oxirgisiniYangila((x) => ({ matn: x.matn + bolak }));
      }
      oxirgisiniYangila(() => ({ holat: "tayyor" }));
      setElon("Javob tayyor.");
    } catch (xato) {
      const toxtadi = yangiPult.signal.aborted;
      oxirgisiniYangila(() => ({
        holat: toxtadi ? "toxtatildi" : "xato",
      }));
      setElon(
        toxtadi
          ? "Javob to'xtatildi."
          : `Javob kelmadi: ${xato instanceof Error ? xato.message : String(xato)}`,
      );
    } finally {
      pult.current = null;
    }
  }

  function yubor(matn: string) {
    const savol = matn.trim();
    if (savol === "" || yozmoqda) {
      return;
    }
    pastdami.current = true;
    void sora([
      ...xabarlar,
      {
        id: xabarlar.length + 1,
        rol: "foydalanuvchi",
        matn: savol,
        holat: "tayyor",
      },
    ]);
  }

  function qaytaYarat() {
    // Oxirgi javob olib tashlanadi, o'sha savol qayta yuboriladi
    const tarix = xabarlar.slice(0, -1);
    if (tarix.at(-1)?.rol === "foydalanuvchi") {
      void sora(tarix);
    }
  }

  return (
    <>
      <title>Yordamchi — Vazifalar</title>
      <h2 ref={sarlavhaRef} tabIndex={-1}>
        Yordamchi
      </h2>
      {MANZIL === undefined ? (
        <p id="yordamchi-yoq">
          Yordamchi bu build'da ulanmagan (server kerak — 25-qism).
        </p>
      ) : (
        <>
          <ol id="chat" ref={royxat} aria-label="Suhbat">
            {xabarlar.map((x) => (
              <li
                key={x.id}
                className={`chat-${x.rol}`}
                data-holat={x.holat}
                aria-busy={x.holat === "yozmoqda"}
              >
                <span className="korinmas">
                  {x.rol === "foydalanuvchi" ? "Siz: " : "Yordamchi: "}
                </span>
                {x.rol === "yordamchi" ? (
                  <Suspense
                    fallback={<p className="izoh-xom">{x.matn}</p>}
                  >
                    <MarkdownMatn matn={x.matn} />
                  </Suspense>
                ) : (
                  <p>{x.matn}</p>
                )}
                {x.holat === "toxtatildi" && (
                  <p className="izoh">(to'xtatildi)</p>
                )}
                {x.holat === "xato" && (
                  <p className="xato">(javob uzildi)</p>
                )}
              </li>
            ))}
          </ol>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              yubor(maydon.current?.value ?? "");
              if (maydon.current !== null) {
                maydon.current.value = "";
              }
            }}
          >
            <label htmlFor={maydonId}>Savolingiz</label>
            <textarea
              id={maydonId}
              ref={maydon}
              rows={3}
              maxLength={500}
              onKeyDown={(event) => {
                // Enter — yuborish, Shift+Enter — yangi qator (chatlardagidek)
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <p className="qator">
              <Tugma
                type="submit"
                id="chat-yubor"
                variant="asosiy"
                disabled={yozmoqda}
              >
                Yuborish
              </Tugma>
              {yozmoqda ? (
                <Tugma
                  id="chat-toxtat"
                  onClick={() => pult.current?.abort()}
                >
                  To'xtatish
                </Tugma>
              ) : (
                xabarlar.at(-1)?.rol === "yordamchi" && (
                  <Tugma id="chat-qayta" onClick={qaytaYarat}>
                    Qayta yaratish
                  </Tugma>
                )
              )}
            </p>
          </form>
          <p id="chat-elon" role="status">
            {elon}
          </p>
        </>
      )}
    </>
  );
}
