// TeglarJadvali.tsx — teglar statistikasi jadvali (20/#14): TanStack Table
// v9 (headless — markup, uslub va a11y bizniki; kutubxona ustunlar,
// saralash holati va qatorlar modelini beradi). 18/#38 dagi jadval shu
// yerga ko'chdi; yangi: ustun sarlavhasini bosib saralash (aria-sort).
// «Teglar tartibi» tanlovi (18/#03) qoladi — u tez tanlov, sarlavhalar
// bilan BITTA saralash holatini boshqaradi
import { useId, useState } from "react";
import type { CSSProperties } from "react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { TegHisobi } from "./batafsil-statistika.ts";

// Imkoniyatlar (features) — modul darajasida, bir marta (v9 qoidasi:
// har renderda yangi obyekt bo'lsa, qatorlar modeli qayta quriladi).
// Faqat saralash: filtr, sahifalash kerak emas (o'nlab teg)
const imkoniyatlar = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { basic: sortFn_basic },
});

const ustun = createColumnHelper<typeof imkoniyatlar, TegHisobi>();
// sortFn "basic" — oddiy < / > (18-qismdagi alifbo tartibi bilan bir xil:
// "#aka" < "#bozor"); sortDescFirst — sonlar avval ko'pidan
const ustunlar = ustun.columns([
  ustun.accessor("teg", { header: "Teg", sortFn: "basic" }),
  ustun.accessor("jami", {
    header: "Jami",
    sortFn: "basic",
    sortDescFirst: true,
  }),
  ustun.accessor("bajarildi", {
    header: "Bajarilgan",
    sortFn: "basic",
    sortDescFirst: true,
  }),
]);

// Tanlov ↔ saralash holati. "soni" — saralashsiz: statistika o'zi
// ko'pi oldin beradi (teng bo'lsa — ro'yxatdagi tartib)
const TANLOVLAR = {
  soni: [] as SortingState,
  alifbo: [{ id: "teg", desc: false }] as SortingState,
};

function tanlovNomi(s: SortingState): string {
  if (s.length === 0) return "soni";
  if (s.length === 1 && s[0]?.id === "teg" && !s[0].desc)
    return "alifbo";
  return "ustun"; // sarlavha bosilgan
}

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

type Props = { teglar: readonly TegHisobi[] };

export function TeglarJadvali({ teglar }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tanlovId = useId();
  const jadval = useTable({
    features: imkoniyatlar,
    columns: ustunlar,
    data: teglar,
    state: { sorting },
    onSortingChange: setSorting,
  });
  return (
    <>
      <p>
        <label htmlFor={tanlovId}>Teglar tartibi</label>{" "}
        <select
          id={tanlovId}
          className="teglar-tartibi"
          value={tanlovNomi(sorting)}
          onChange={(event) =>
            setSorting(
              event.target.value === "alifbo"
                ? TANLOVLAR.alifbo
                : TANLOVLAR.soni,
            )
          }
        >
          <option value="soni">Ko'pi oldin</option>
          <option value="alifbo">Alifbo bo'yicha</option>
          {/* Sarlavha bosilganda tanlovda shu ko'rinadi */}
          <option value="ustun" hidden>
            Ustun bo'yicha
          </option>
        </select>
      </p>
      <table id="teglar-jadvali">
        <caption>Teglar bo'yicha</caption>
        <thead>
          {jadval.getHeaderGroups().map((guruh) => (
            <tr key={guruh.id}>
              {guruh.headers.map((sarlavha) => {
                const tartib = sarlavha.column.getIsSorted();
                const Belgi =
                  tartib === "asc"
                    ? ArrowUp
                    : tartib === "desc"
                      ? ArrowDown
                      : ArrowUpDown;
                return (
                  // aria-sort — faqat saralangan ustunda (APG: bitta ustun)
                  <th
                    key={sarlavha.id}
                    scope="col"
                    aria-sort={
                      tartib === false ? undefined : ARIA_SORT[tartib]
                    }
                  >
                    {/* Tugma — klaviatura bilan ham (Enter/Space) */}
                    <button
                      type="button"
                      className="inline-flex min-h-bosish items-center gap-1 border-0 bg-transparent p-0 font-bold"
                      onClick={sarlavha.column.getToggleSortingHandler()}
                    >
                      <jadval.FlexRender header={sarlavha} />
                      <Belgi size={14} />
                    </button>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {jadval.getRowModel().rows.map((qator) => {
            const t = qator.original;
            const ulush: CSSProperties = {
              "--ulush": `${Math.round((t.bajarildi / t.jami) * 100)}%`,
            };
            return (
              <tr key={t.teg}>
                <th scope="row">{t.teg}</th>
                <td>{t.jami}</td>
                <td>
                  {t.bajarildi}
                  {/* Ulush chizig'i — CSS o'zgaruvchisi (18/#38) */}
                  <span
                    className="ulush"
                    aria-hidden="true"
                    style={ulush}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
