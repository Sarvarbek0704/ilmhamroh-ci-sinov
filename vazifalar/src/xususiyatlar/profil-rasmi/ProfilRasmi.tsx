// ProfilRasmi.tsx — fayl yuklash UI (19/#36): tanlash yoki sudrab tashlash,
// tekshiruv (tur, hajm), oldindan ko'rish (preview), yuborish jarayoni
// (progress) va bekor qilish. Asosiy yo'l — <input type="file"> (klaviatura
// va ekran o'quvchi); sudrab tashlash — qo'shimcha qulaylik
import { useEffect, useId, useRef, useState } from "react";
import type { DragEvent } from "react";
import { flushSync } from "react-dom";
import { Tugma } from "../../ui/Tugma.tsx";
import {
  faylniTekshir,
  hajmMatni,
  RUXSAT_TURLAR,
} from "./fayl-tekshir.ts";
import {
  rasmniOchir,
  rasmniSaqla,
  useProfilRasmi,
} from "./profil-rasmi.ts";
import { faylniYukla } from "./yuklash.ts";
import { RasmKesish } from "./RasmKesish.tsx";
import type { Jarayon } from "./yuklash.ts";

// «Bahor» mashq serveri: faylni saqlamaydi, nima kelganini aytadi
const YUKLASH_MANZILI = `${import.meta.env.VITE_API_URL}/aks`;

export function ProfilRasmi() {
  const saqlangan = useProfilRasmi();
  const maydonId = useId();
  // Tanlangan fayl va uning oldindan ko'rish URL'i — birga (obyekt URL
  // fayl tanlanganda yaratiladi, almashganda bo'shatiladi — effektsiz)
  const [tanlangan, setTanlangan] = useState<{
    fayl: File;
    url: string;
  } | null>(null);
  const fayl = tanlangan?.fayl ?? null;
  const korinish = tanlangan?.url ?? null;
  const joriyUrl = useRef<string | null>(null);
  const [xabar, setXabar] = useState("");
  const [jarayon, setJarayon] = useState<Jarayon | null>(null);
  const [ustida, setUstida] = useState(false);
  // 21/#12: kesish oynasi ochiqmi (ixtiyoriy qadam: asl rasm ham saqlanadi)
  const [kesilmoqda, setKesilmoqda] = useState(false);
  const kesTugmasi = useRef<HTMLButtonElement>(null);
  const pult = useRef<AbortController | null>(null);

  // Obyekt URL bo'shatilmasa — Blob sahifa yopilguncha xotirada qoladi
  function almashtir(yangi: File | null) {
    if (joriyUrl.current !== null) {
      URL.revokeObjectURL(joriyUrl.current);
    }
    const url = yangi === null ? null : URL.createObjectURL(yangi);
    joriyUrl.current = url;
    setTanlangan(
      yangi === null || url === null ? null : { fayl: yangi, url },
    );
  }

  // Komponent yopilsa — yo'ldagi yuborish to'xtasin, URL bo'shasin
  useEffect(
    () => () => {
      pult.current?.abort();
      if (joriyUrl.current !== null) {
        URL.revokeObjectURL(joriyUrl.current);
      }
    },
    [],
  );

  function tanla(tanlangan: File | undefined) {
    if (tanlangan === undefined) {
      return;
    }
    setKesilmoqda(false);
    const xato = faylniTekshir(tanlangan);
    almashtir(xato === null ? tanlangan : null);
    setXabar(
      xato ??
        `${tanlangan.name} — ${hajmMatni(tanlangan.size)}. Saqlashga tayyor.`,
    );
  }

  async function saqla() {
    if (fayl === null) {
      return;
    }
    const yangiPult = new AbortController();
    pult.current = yangiPult;
    setJarayon({ yuborildi: 0, jami: fayl.size });
    setXabar("Yuborilmoqda…");
    try {
      await faylniYukla(YUKLASH_MANZILI, fayl, {
        onJarayon: setJarayon,
        signal: yangiPult.signal,
      });
      await rasmniSaqla(fayl);
      almashtir(null);
      setXabar("Profil rasmi saqlandi.");
    } catch (xato) {
      setXabar(xato instanceof Error ? xato.message : String(xato));
    } finally {
      setJarayon(null);
      pult.current = null;
    }
  }

  function tashlandi(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setUstida(false);
    tanla(event.dataTransfer.files[0]);
  }

  return (
    <section id="profil-rasmi" aria-labelledby={`${maydonId}-sarlavha`}>
      <h3 id={`${maydonId}-sarlavha`}>Profil rasmi</h3>
      {saqlangan !== null && fayl === null && (
        <p className="qator">
          <img
            src={saqlangan}
            alt="Joriy profil rasmi"
            width={64}
            height={64}
          />
          <Tugma id="rasm-ochir" onClick={() => void rasmniOchir()}>
            Rasmni olib tashlash
          </Tugma>
        </p>
      )}
      <div
        id="rasm-zona"
        className={ustida ? "ustida" : undefined}
        onDragOver={(event) => {
          event.preventDefault();
          setUstida(true);
        }}
        onDragLeave={() => setUstida(false)}
        onDrop={tashlandi}
      >
        <label htmlFor={maydonId}>
          Rasm tanlang (PNG, JPEG, WebP; 1 MB gacha) yoki shu yerga
          tashlang
        </label>
        <input
          id={maydonId}
          type="file"
          accept={RUXSAT_TURLAR.join(",")}
          disabled={jarayon !== null}
          onChange={(event) => {
            tanla(event.target.files?.[0]);
            event.target.value = ""; // o'sha faylni qayta tanlash mumkin bo'lsin
          }}
        />
      </div>
      {korinish !== null && kesilmoqda && (
        <RasmKesish
          url={korinish}
          onTayyor={(kesilgan) => {
            const asl = fayl?.size ?? 0;
            // flushSync: «Kesish…» tugmasi DOM'ga qaytgach — darhol fokus
            // (kesish oynasi yopilganda fokus <body> ga tushmasin)
            flushSync(() => {
              almashtir(kesilgan);
              setKesilmoqda(false);
              setXabar(
                `Kesildi: 256×256, ${hajmMatni(kesilgan.size)} (asli ${hajmMatni(asl)}). Saqlashga tayyor.`,
              );
            });
            kesTugmasi.current?.focus();
          }}
          onBekor={() => {
            flushSync(() => setKesilmoqda(false));
            kesTugmasi.current?.focus();
          }}
        />
      )}
      {korinish !== null && !kesilmoqda && (
        <img
          id="rasm-korinish"
          src={korinish}
          alt="Tanlangan rasm (hali saqlanmagan)"
          width={128}
          height={128}
        />
      )}
      {jarayon !== null && (
        <p>
          <label htmlFor={`${maydonId}-jarayon`}>Yuborilmoqda</label>{" "}
          <progress
            id={`${maydonId}-jarayon`}
            max={jarayon.jami}
            value={jarayon.yuborildi}
          />{" "}
          {`${Math.round((jarayon.yuborildi / jarayon.jami) * 100)}%`}
        </p>
      )}
      <p id="rasm-xabar" role="status">
        {xabar}
      </p>
      <p className="qator">
        {fayl !== null && jarayon === null && !kesilmoqda && (
          <Tugma
            id="rasm-kes"
            ref={kesTugmasi}
            onClick={() => setKesilmoqda(true)}
          >
            Kesish…
          </Tugma>
        )}
        {fayl !== null && jarayon === null && !kesilmoqda && (
          <Tugma
            id="rasm-saqla"
            variant="asosiy"
            onClick={() => void saqla()}
          >
            Saqlash
          </Tugma>
        )}
        {jarayon !== null && (
          <Tugma id="rasm-bekor" onClick={() => pult.current?.abort()}>
            Bekor qilish
          </Tugma>
        )}
      </p>
    </section>
  );
}
