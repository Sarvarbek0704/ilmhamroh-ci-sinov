// VazifaTahriri.tsx — "/vazifa/:id/tahrir" (19/#29–#32): React Hook Form
// + Zod. Ro'yxat sahifasidagi formalar — React'ning o'z <form action>
// (18/#05); bu yerda — ko'p maydonli forma: har maydonning xatosi, "o'zgardimi"
// (isDirty), jonli ko'rinish (useWatch), boshqariladigan maxsus element
// (Controller) va server xatosi (setError "root") — RHF shularni beradi.
// register — uncontrolled: harf yozilganda React qayta CHIZMAYDI
import { useId, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOrqaga } from "../hooklar/useOrqaga.ts";
import { useIlovaHolati } from "../ilova-holati.ts";
import { teglariniOl, VazifalarRoyxati } from "../royxat.ts";
import { api, useVazifalar, useYozuv } from "../server-sinxron.ts";
import { tahrirSxemasi } from "../sxemalar/vazifa-formasi.ts";
import type { TahrirQiymati } from "../sxemalar/vazifa-formasi.ts";
import { Almashtirgich } from "../ui/Almashtirgich.tsx";
import { Tugma } from "../ui/Tugma.tsx";
import { useVazifa } from "./vazifa-konteksti.ts";

export function VazifaTahriri() {
  const { vazifa } = useVazifa();
  const { vazifalar } = useVazifalar();
  const yoz = useYozuv();
  const elonQil = useIlovaHolati((h) => h.elonQil);
  const orqaga = useOrqaga(`/vazifa/${vazifa.id}`);
  const xatoId = useId();
  // Sxema ro'yxatga bog'liq (takror matn) — ro'yxat o'zgarsa, yangisi
  const sxema = useMemo(() => {
    const royxat = VazifalarRoyxati.dan(vazifalar);
    return tahrirSxemasi((matn) => royxat.matnBormi(matn, vazifa.id));
  }, [vazifalar, vazifa.id]);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    // zodResolver (19/#31): yuborishda (va mode bo'yicha) sxema
    // tekshiradi, xatolar — errors.<maydon>.message. Natija turi —
    // sxemaning chiqishi (kesilgan matn)
    resolver: zodResolver(sxema),
    defaultValues: { matn: vazifa.matn, bajarildi: vazifa.bajarildi },
    // Xato — maydondan chiqqanda (blur), keyin — har o'zgarishda
    mode: "onTouched",
  });
  // useWatch (19/#32): faqat shu qiymat o'zgarganda — teglar ko'rinishi
  const matn = useWatch({ control, name: "matn" });
  const teglar = [...teglariniOl(matn)];

  async function saqla(qiymat: TahrirQiymati) {
    if (!isDirty) {
      orqaga(); // o'zgarish yo'q — serverga so'rov ham yo'q
      return;
    }
    const natija = await yoz(async () => ({
      tur: "serverdanKeldi",
      vazifa: await api.yangila(vazifa.id, qiymat),
    }));
    if (!natija.ok) {
      // Server xatosi — maydonga emas, butun formaga
      setError("root.server", { message: natija.xabar });
      return;
    }
    elonQil("O'zgarish saqlandi.");
    orqaga();
  }

  const matnXatosi = errors.matn?.message;
  return (
    // noValidate: brauzerning o'z pufakchalari emas — sxema xabarlari
    <form
      id="tahrir-forma"
      noValidate
      onSubmit={(event) => void handleSubmit(saqla)(event)}
    >
      <p>
        <label htmlFor="tahrir-matn">Matn</label>
        <input
          id="tahrir-matn"
          autoComplete="off"
          aria-invalid={matnXatosi === undefined ? undefined : true}
          aria-describedby={
            matnXatosi === undefined ? undefined : xatoId
          }
          {...register("matn")}
        />
      </p>
      <p id={xatoId} className="xato" role="status">
        {matnXatosi}
      </p>
      <p id="tahrir-teglar">
        {teglar.length === 0
          ? "Teg yo'q"
          : `Teglar: ${teglar.join(", ")}`}
      </p>
      {/* Controller (19/#32): RHF ref ulay olmaydigan element — qiymat va
          o'zgarish props orqali (boshqariladigan) */}
      <Controller
        control={control}
        name="bajarildi"
        render={({ field }) => (
          <Almashtirgich
            id="tahrir-bajarildi"
            ref={field.ref}
            yoqilgan={field.value}
            onOzgar={field.onChange}
            onBlur={field.onBlur}
          >
            Bajarildi
          </Almashtirgich>
        )}
      />
      <p id="tahrir-server-xato" className="xato" role="alert">
        {errors.root?.server?.message}
      </p>
      <div className="qator">
        {/* disabled emas: o'chirilgan tugmaga Tab bilan borilmaydi va
            sababi aytilmaydi. O'zgarish yo'q bo'lsa — saqla() o'zi qaytadi */}
        <Tugma type="submit" variant="asosiy">
          {isSubmitting ? "Saqlanmoqda…" : "Saqlash"}
        </Tugma>
        <Tugma onClick={orqaga}>Bekor qilish</Tugma>
      </div>
    </form>
  );
}
