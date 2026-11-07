// YangiLoyiha.tsx — "/yangi" (19/#33): ko'p qadamli forma (wizard).
// BITTA useForm, uch qadam: qadam o'zgarganda maydonlar unmount bo'ladi,
// lekin qiymatlar formada qoladi (shouldUnregister: false — sukut).
// Har "Keyingi" — faqat shu qadam maydonlari tekshiriladi (trigger).
// Dinamik maydonlar — useFieldArray; serverdagi takror — async tekshiruv
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import type { FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useIlovaHolati } from "../ilova-holati.ts";
import { VazifalarRoyxati } from "../royxat.ts";
import {
  api,
  royxatSorovi,
  useVazifalar,
  useYozuv,
} from "../server-sinxron.ts";
import {
  loyihaSxemasi,
  QADAM_ENG_KOP,
  vazifaMatni,
} from "../sxemalar/loyiha-formasi.ts";
import type {
  LoyihaKirishi,
  LoyihaQiymati,
} from "../sxemalar/loyiha-formasi.ts";
import type { VazifaMalumoti } from "../turlar.ts";
import { Combobox } from "../ui/Combobox.tsx";
import { Tugma } from "../ui/Tugma.tsx";
import { useQobiq } from "./qobiq-konteksti.ts";

const QADAMLAR = ["Teg", "Qadamlar", "Tekshirish"] as const;
// Har qadamda qaysi maydonlar tekshiriladi
const MAYDONLAR: readonly (readonly FieldPath<LoyihaKirishi>[])[] = [
  ["teg"],
  ["qadamlar"],
  [],
];

export function YangiLoyiha() {
  const { sarlavhaRef } = useQobiq();
  const mijoz = useQueryClient();
  const { vazifalar } = useVazifalar();
  const yoz = useYozuv();
  const elonQil = useIlovaHolati((h) => h.elonQil);
  const navigate = useNavigate();
  const [qadam, setQadam] = useState(0);
  const [jarayon, setJarayon] = useState<string | null>(null);
  const legendRef = useRef<HTMLLegendElement>(null);
  const tegXatoId = useId();
  // 19/#35: mavjud teglar — ko'p ishlatilgani oldin (combobox takliflari)
  const teglar = useMemo(
    () =>
      [...VazifalarRoyxati.dan(vazifalar).tegHisobi()]
        .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([teg]) => teg),
    [vazifalar],
  );

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoyihaKirishi, unknown, LoyihaQiymati>({
    // Async tekshiruv (19/#33): serverdagi ENG SO'NGGI ro'yxat (keshda
    // eskirgan bo'lishi mumkin — staleTime 0 bilan qayta so'raladi)
    resolver: zodResolver(
      loyihaSxemasi(async (matnlar) => {
        const royxat = VazifalarRoyxati.dan(
          await mijoz.fetchQuery({
            ...royxatSorovi(mijoz),
            staleTime: 0,
          }),
        );
        return matnlar.find((m) => royxat.matnBormi(m, null)) ?? null;
      }),
    ),
    defaultValues: { teg: "", qadamlar: [{ matn: "" }] },
    // Tekshiruv — "Keyingi" va yuborishda; xato bo'lgach — maydondan
    // chiqqanda (har harfda serverga so'rov ketmasin)
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });
  // useFieldArray (19/#33): ro'yxat — massiv; har elementga barqaror
  // id (key uchun — indeks emas: o'rtadagisi o'chsa, holat adashmaydi)
  const { fields, append, remove } = useFieldArray({
    control,
    name: "qadamlar",
  });
  const qiymatlar = useWatch({ control });

  // Qadam almashdi — fokus yangi qadam sarlavhasiga (ekran o'quvchi
  // qayerda ekanini eshitadi)
  const birinchi = useRef(true);
  useLayoutEffect(() => {
    if (birinchi.current) {
      birinchi.current = false;
      return;
    }
    legendRef.current?.focus();
  }, [qadam]);

  async function keyingi() {
    const maydonlar = MAYDONLAR[qadam] ?? [];
    // trigger — faqat shu maydonlar; true — xato yo'q
    if (await trigger([...maydonlar], { shouldFocus: true })) {
      setQadam((q) => q + 1);
    }
  }

  async function yarat(qiymat: LoyihaQiymati) {
    const matnlar = qiymat.qadamlar.map((q) =>
      vazifaMatni(q.matn, qiymat.teg),
    );
    const natija = await yoz(async () => {
      const yangilar: VazifaMalumoti[] = [];
      // Ketma-ket: server id'larni tartib bilan beradi
      for (const [i, matn] of matnlar.entries()) {
        setJarayon(`Qo'shilmoqda: ${i + 1} / ${matnlar.length}`);
        yangilar.push(await api.qosh(matn));
      }
      return {
        tur: "royxatKeldi",
        vazifalar: [...vazifalar, ...yangilar],
      };
    });
    setJarayon(null);
    if (!natija.ok) {
      setError("root.server", { message: natija.xabar });
      return;
    }
    elonQil(`${matnlar.length} ta vazifa qo'shildi (${qiymat.teg}).`);
    void navigate(
      `/?${new URLSearchParams({ filtr: "faol" }).toString()}`,
    );
  }

  const tegXatosi = errors.teg?.message;
  return (
    <>
      <title>Qadamlarga bo'lib qo'shish — Vazifalar</title>
      <h2 ref={sarlavhaRef} tabIndex={-1}>
        Qadamlarga bo'lib qo'shish
      </h2>
      <ol className="usta-qadamlari" aria-label="Qadamlar">
        {QADAMLAR.map((nomi, i) => (
          <li
            key={nomi}
            aria-current={i === qadam ? "step" : undefined}
          >
            {nomi}
          </li>
        ))}
      </ol>
      <form
        id="usta"
        noValidate
        onSubmit={(event) => void handleSubmit(yarat)(event)}
      >
        <fieldset>
          <legend ref={legendRef} tabIndex={-1}>
            {`${qadam + 1}/${QADAMLAR.length}: ${QADAMLAR[qadam] ?? ""}`}
          </legend>
          {qadam === 0 && (
            <p>
              <label htmlFor="usta-teg">Umumiy teg</label>
              {/* 19/#35: maxsus input — combobox (Controller orqali:
                  qiymat va o'zgarish props bilan) */}
              <Controller
                control={control}
                name="teg"
                render={({ field }) => (
                  <Combobox
                    id="usta-teg"
                    ref={field.ref}
                    qiymat={field.value}
                    onOzgar={field.onChange}
                    onBlur={field.onBlur}
                    takliflar={teglar}
                    placeholder="#ta'mir"
                    aria-invalid={
                      tegXatosi === undefined ? undefined : true
                    }
                    aria-describedby={tegXatoId}
                  />
                )}
              />
              <span id={tegXatoId} className="xato" role="status">
                {tegXatosi}
              </span>
            </p>
          )}
          {qadam === 1 && (
            <>
              <ol id="usta-qadamlar">
                {fields.map((maydon, i) => {
                  const xato = errors.qadamlar?.[i]?.matn?.message;
                  const xatoId = `usta-qadam-${i}-xato`;
                  return (
                    <li key={maydon.id}>
                      <label htmlFor={`usta-qadam-${i}`}>
                        {`${i + 1}-qadam`}
                      </label>
                      <input
                        id={`usta-qadam-${i}`}
                        autoComplete="off"
                        aria-invalid={
                          xato === undefined ? undefined : true
                        }
                        aria-describedby={xatoId}
                        {...register(`qadamlar.${i}.matn`)}
                      />
                      <Tugma
                        aria-label={`O'chirish: ${i + 1}-qadam`}
                        onClick={() => remove(i)}
                        disabled={fields.length === 1}
                      >
                        ✕
                      </Tugma>
                      <span id={xatoId} className="xato" role="status">
                        {xato}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="xato" role="status">
                {errors.qadamlar?.root?.message ??
                  errors.qadamlar?.message}
              </p>
              <Tugma
                id="usta-qadam-qosh"
                disabled={fields.length >= QADAM_ENG_KOP}
                // append — yangi maydon chizilgach fokus unga (sukut)
                onClick={() => append({ matn: "" })}
              >
                Qadam qo'shish
              </Tugma>
            </>
          )}
          {qadam === 2 && (
            <ul id="usta-natija">
              {(qiymatlar.qadamlar ?? []).map((q, i) => (
                <li key={fields[i]?.id ?? i}>
                  {vazifaMatni(q.matn ?? "", qiymatlar.teg ?? "")}
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <p id="usta-jarayon" role="status">
          {jarayon}
        </p>
        <p id="usta-server-xato" className="xato" role="alert">
          {errors.root?.server?.message}
        </p>
        <div className="qator">
          {qadam > 0 && (
            <Tugma onClick={() => setQadam((q) => q - 1)}>Orqaga</Tugma>
          )}
          {qadam < QADAMLAR.length - 1 ? (
            <Tugma
              id="usta-keyingi"
              variant="asosiy"
              onClick={() => void keyingi()}
            >
              Keyingi
            </Tugma>
          ) : (
            <Tugma
              id="usta-yarat"
              type="submit"
              variant="asosiy"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Yaratilmoqda…" : "Yaratish"}
            </Tugma>
          )}
        </div>
      </form>
    </>
  );
}
