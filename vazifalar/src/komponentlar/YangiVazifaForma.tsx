// YangiVazifaForma.tsx — yangi vazifa: maydon, xato va teg takliflari
// (17/#12: useState). Forma o'zi eslab qoladigan ikki narsa — xato
// matni va takliflar — komponentning state'i: o'zgarsa, React formani
// qayta chizadi. v6 da "xato bormi" savoliga DOM javob berardi
// (aria-invalid atributi), endi — state, atribut esa undan chiziladi.
// 18/#05–#06: yuborish — <form action> + useActionState + useFormStatus
import {
  useActionState,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";
import { useFormStatus } from "react-dom";
import { joriyTeg } from "../royxat.ts";
import type { JoriyTeg } from "../royxat.ts";
import type { QoshishNatijasi } from "../turlar.ts";
import { Vazifa } from "../vazifa.ts";
// 20/#08: ikonka (bezak, aria-hidden)
import { Plus } from "lucide-react";
import { Tugma } from "../ui/Tugma.tsx";

type Props = {
  boshlangichMatn: string; // qoralama (sahifa yangilanganda tiklanadi)
  xatoniTop: (matn: string) => string | null;
  takliflarniTop: (joriy: JoriyTeg | null) => readonly string[];
  onYoz: (matn: string) => void; // har o'zgarishda (qoralama)
  // 18/#05: async — server javobigacha kutiladi (action)
  onQosh: (matn: string) => Promise<QoshishNatijasi>;
};

// Action natijasi (useActionState state'i): xato va maydonda QOLADIGAN
// matn. React action tugagach formani O'ZI tozalaydi (reset — maydon
// defaultValue'ga qaytadi); defaultValue — shu matn: xato bo'lsa yozilgan
// matn joyida qoladi, qo'shilsa — bo'sh. 17/#19 da aynan shu muammo
// (reset matnni o'chirardi) <form action> ni kanondan chiqargan edi
type FormaHolati = {
  readonly xato: string | null;
  readonly matn: string;
};

const XATO_ID = "yangi-matn-xato";

// useFormStatus (18/#06): o'z formasining holati — props'siz. Faqat
// <form> ICHIDAGI komponentda ishlaydi (forma o'zi emas). Tugma bloklanmaydi
// (optimistik: keyingi vazifani yozish mumkin), faqat matni
function QoshishTugmasi() {
  const { pending } = useFormStatus();
  return (
    <Tugma type="submit" id="qoshish-tugma" variant="asosiy">
      <Plus size={16} />
      {pending ? "Qo'shilmoqda…" : "Qo'shish"}
    </Tugma>
  );
}

export function YangiVazifaForma({
  boshlangichMatn,
  xatoniTop,
  takliflarniTop,
  onYoz,
  onQosh,
}: Props) {
  const [takliflar, setTakliflar] = useState<readonly string[]>([]);
  // useActionState (18/#06): action natijasi (oldingi state → yangisi).
  // Bir necha yuborish — navbat bilan (biri tugagach keyingisi)
  const [holat, yuborish] = useActionState(
    async (
      _oldingi: FormaHolati,
      malumot: FormData,
    ): Promise<FormaHolati> => {
      const xom = malumot.get("matn");
      const yozilgan = typeof xom === "string" ? xom : "";
      const natija = await onQosh(yozilgan.trim());
      switch (natija.tur) {
        case "xato":
          return { xato: natija.xabar, matn: yozilgan };
        case "saqlanmadi":
          // internet yo'q yoki server rad etdi — matn maydonda qoladi
          return { xato: null, matn: yozilgan };
        case "qoshildi":
          setTakliflar([]);
          return { xato: null, matn: "" };
        default: {
          const qolmadi: never = natija;
          return qolmadi;
        }
      }
    },
    { xato: null, matn: boshlangichMatn },
  );
  // Xato tuzatilsa — yo'qolsin: qaysi natijaning xatosi "tuzatilgan"
  const [tuzatilgan, setTuzatilgan] = useState<FormaHolati | null>(
    null,
  );
  const xato = tuzatilgan === holat ? null : holat.xato;
  // DOM'ga havolalar (17/#34): maydon va takliflar guruhi
  const maydonRef = useRef<HTMLInputElement>(null);
  const takliflarRef = useRef<HTMLDivElement>(null);

  // Xato bilan qaytgan natija — fokus maydonga («Qo'shish» bosilgan
  // bo'lsa ham). Natija action tugagach keladi — hodisada emas
  useLayoutEffect(() => {
    if (holat.xato !== null) {
      maydonRef.current?.focus();
    }
  }, [holat]);

  // Maydon o'zgardi (harf, teg tanlandi): qoralama, takliflar, xato
  function ozgardi(maydon: HTMLInputElement) {
    onYoz(maydon.value);
    const kursor = maydon.selectionStart ?? maydon.value.length;
    setTakliflar(takliflarniTop(joriyTeg(maydon.value, kursor)));
    if (xato !== null && xatoniTop(maydon.value.trim()) === null) {
      setTuzatilgan(holat);
    }
  }

  // ↓ — birinchi taklifga, Esc — takliflarni yopish
  function maydondaTugma(event: KeyboardEvent<HTMLInputElement>) {
    if (takliflar.length === 0 || event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      takliflarRef.current?.querySelector("button")?.focus();
    } else if (event.key === "Escape") {
      setTakliflar([]);
    }
  }

  // Yozilayotgan teg to'liq teg + probel bilan almashadi, fokus maydonga
  function tegniQoy(teg: string) {
    const maydon = maydonRef.current;
    if (maydon === null) {
      return;
    }
    const kursor = maydon.selectionStart ?? maydon.value.length;
    const joriy = joriyTeg(maydon.value, kursor);
    if (joriy !== null) {
      maydon.setRangeText(`${teg} `, joriy.boshi, kursor, "end");
    }
    maydon.focus();
    ozgardi(maydon);
  }

  function takliflardaTugma(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setTakliflar([]);
      maydonRef.current?.focus();
    }
  }

  return (
    // <form action> (18/#05): React submit'ni o'zi ushlaydi (preventDefault
    // shart emas), funksiyani transition ichida chaqiradi va oxirida
    // formani tozalaydi (reset)
    <form id="yangi-forma" noValidate action={yuborish}>
      <label htmlFor="yangi-matn">Yangi vazifa</label>
      <div className="qator">
        {/* Uncontrolled: qiymat DOM'da, React faqat boshlang'ichini
            beradi (defaultValue — action natijasidagi matn) */}
        <input
          ref={maydonRef}
          id="yangi-matn"
          name="matn"
          required
          maxLength={Vazifa.MAKS_UZUNLIK}
          autoComplete="off"
          defaultValue={holat.matn}
          aria-invalid={xato !== null ? true : undefined}
          aria-describedby={xato !== null ? XATO_ID : undefined}
          onInput={(event) => ozgardi(event.currentTarget)}
          onKeyDown={maydondaTugma}
        />
        <QoshishTugmasi />
      </div>
      <div
        ref={takliflarRef}
        id="teg-takliflari"
        role="group"
        aria-label="Teg takliflari"
        hidden={takliflar.length === 0}
        onKeyDown={takliflardaTugma}
      >
        {takliflar.map((teg) => (
          <button
            key={teg}
            type="button"
            data-teg={teg}
            onClick={() => tegniQoy(teg)}
          >
            {teg}
          </button>
        ))}
      </div>
      <p id={XATO_ID} className="xato" role="status">
        {xato}
      </p>
    </form>
  );
}
