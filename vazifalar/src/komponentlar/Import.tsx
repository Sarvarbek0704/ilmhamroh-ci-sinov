// Import.tsx — JSON matnidan, fayldan yoki sudrab tashlab (13/#12, #14).
// Matn maydoni — uncontrolled (17/#19): qiymat faqat yuborilganda kerak,
// FormData bilan o'qiladi; har harfda state yangilash shart emas
import { useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { faylniTekshir } from "../fayl.ts";
import { csvdanVazifalar } from "../csv.ts";
import { eksportMatni } from "../paket.ts";
import { Tugma } from "../ui/Tugma.tsx";

type Props = {
  // null — import bo'ldi (e'lon va server — chaqiruvchida), aks holda xato
  onImport: (matn: string) => string | null;
};

// Xato qaysi maydondan: o'sha maydon belgilanadi (aria-invalid)
type Xato = { readonly xabar: string; readonly manba: "matn" | "fayl" };

// Sudrab tashlash — sichqoncha uchun qulaylik; klaviatura va ekran
// o'quvchi uchun yo'l — fayl tanlash maydoni
const faylmi = (event: DragEvent): boolean =>
  event.dataTransfer.types.includes("Files");

export function Import({ onImport }: Props) {
  const [xato, setXato] = useState<Xato | null>(null);
  const [ustida, setUstida] = useState(false); // fayl zona ustida
  const sarlavhaId = useId(); // aria-labelledby uchun (17/#37)
  const matnMaydoni = useRef<HTMLTextAreaElement>(null);
  const faylMaydoni = useRef<HTMLInputElement>(null);

  function xatoniKorsat(xabar: string, manba: Xato["manba"]) {
    setXato({ xabar, manba });
    (manba === "matn" ? matnMaydoni : faylMaydoni).current?.focus();
  }

  function importQil(matn: string, manba: Xato["manba"]) {
    setXato(null);
    // Buzuq matn — kutilgan xato: qiymat bo'lib qaytadi. Boshqasi —
    // dasturchi xatosi: foydalanuvchiga aytamiz va throw davom etadi
    let xabar;
    try {
      xabar = onImport(matn);
    } catch (kutilmagan) {
      xatoniKorsat("Kutilmagan xato: import bajarilmadi.", manba);
      throw kutilmagan;
    }
    if (xabar !== null) {
      xatoniKorsat(xabar, manba);
    }
  }

  async function fayldan(fayl: File) {
    setXato(null);
    const tekshiruv = faylniTekshir(fayl);
    if (tekshiruv !== null) {
      xatoniKorsat(tekshiruv, "fayl");
      return;
    }
    let matn;
    try {
      matn = await fayl.text(); // File — Blob: text() Promise qaytaradi
    } catch {
      xatoniKorsat("Faylni o'qib bo'lmadi.", "fayl");
      return;
    }
    // 21/#15: CSV — vazifalarga, keyin o'sha JSON paket yo'li (bitta
    // tekshiruv va bitta import kodi)
    if (fayl.name.toLowerCase().endsWith(".csv")) {
      const natija = csvdanVazifalar(matn);
      if (!natija.ok) {
        xatoniKorsat(natija.xato, "fayl");
        return;
      }
      matn = eksportMatni(natija.qiymat);
    }
    importQil(matn, "fayl");
  }

  // FormData (17/#19): formadagi name="paket" maydon qiymati
  function matndan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const matn = new FormData(event.currentTarget).get("paket");
    importQil(typeof matn === "string" ? matn : "", "matn");
  }

  function faylTanlandi(event: ChangeEvent<HTMLInputElement>) {
    // files — FileList | null; [0] — File | undefined
    const fayl = event.currentTarget.files?.[0];
    if (fayl !== undefined) {
      void fayldan(fayl);
    }
    // O'sha faylni qayta tanlash ham change hodisasini bersin
    event.currentTarget.value = "";
  }

  function zonaUstida(event: DragEvent<HTMLElement>) {
    if (!faylmi(event)) {
      return;
    }
    event.preventDefault(); // shusiz brauzer bu yerga tashlashga yo'l bermaydi
    event.dataTransfer.dropEffect = "copy";
    setUstida(true);
  }

  function chiqdi(event: DragEvent<HTMLElement>) {
    // Ichki elementga o'tish ham dragleave beradi — zonadan chiqmagan
    const qayerga = event.relatedTarget;
    if (
      !(qayerga instanceof Node) ||
      !event.currentTarget.contains(qayerga)
    ) {
      setUstida(false);
    }
  }

  function tashlandi(event: DragEvent<HTMLElement>) {
    if (!faylmi(event)) {
      return;
    }
    event.preventDefault();
    setUstida(false);
    const fayl = event.dataTransfer.files[0];
    if (fayl !== undefined) {
      void fayldan(fayl);
    }
  }

  return (
    <section
      id="import-zona"
      aria-labelledby={sarlavhaId}
      className={ustida ? "ustida" : undefined}
      onDragOver={zonaUstida}
      onDragLeave={chiqdi}
      onDrop={tashlandi}
    >
      <h2 id={sarlavhaId}>Import</h2>
      <p className="izoh">
        Eksport faylini shu yerga sudrab tashlash ham mumkin.
      </p>
      <form onSubmit={matndan}>
        <label htmlFor="import-matn">Eksport qilingan JSON matni</label>
        <textarea
          ref={matnMaydoni}
          id="import-matn"
          name="paket"
          rows={6}
          aria-invalid={xato?.manba === "matn" ? true : undefined}
        />
        <Tugma type="submit" id="import-tugma">
          Import qilish
        </Tugma>
      </form>
      <p>
        <label htmlFor="import-fayl">
          Yoki eksport faylini tanlang (.json yoki .csv)
        </label>
        <input
          ref={faylMaydoni}
          type="file"
          id="import-fayl"
          accept=".json,application/json,.csv,text/csv"
          aria-invalid={xato?.manba === "fayl" ? true : undefined}
          onChange={faylTanlandi}
        />
      </p>
      <p id="import-xato" className="xato" aria-live="polite">
        {xato?.xabar}
      </p>
    </section>
  );
}
