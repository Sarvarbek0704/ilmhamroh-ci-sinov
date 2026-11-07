// statistika-ishchi.ts — Web Worker (18/#24): batafsil statistika hisobi
// alohida oqimda. Asosiy oqim (UI) bu paytda bosish va yozishga javob
// beradi; 10 000 vazifada hisob asosiy oqimda 50–66 ms lik uzun vazifa
// edi (o'lchandi, natijalar/24-*). Ishchida DOM, React, localStorage yo'q —
// faqat sof hisob (batafsil-statistika.ts, Vitest (node muhiti) bilan sinalgan)
import { batafsilHisobla } from "./batafsil-statistika.ts";
import type { BatafsilStatistika } from "./batafsil-statistika.ts";
import type { VazifaMalumoti } from "../../turlar.ts";

export type IshchiSorovi = {
  readonly id: number;
  readonly vazifalar: readonly VazifaMalumoti[];
};
export type IshchiJavobi = {
  readonly id: number;
  readonly natija: BatafsilStatistika;
};

// tsconfig'da lib "dom": bu yerda self — Window deb ko'rinadi, ishchida
// esa DedicatedWorkerGlobalScope ("webworker" lib "dom" bilan birga
// qo'shilmaydi — e'lonlar to'qnashadi). Bizga kerak ikki a'zo — shular
type IshchiDunyosi = {
  onmessage: ((event: MessageEvent<IshchiSorovi>) => void) | null;
  postMessage: (javob: IshchiJavobi) => void;
};
const ishchi = self as unknown as IshchiDunyosi;

ishchi.onmessage = (event) => {
  const { id, vazifalar } = event.data;
  ishchi.postMessage({ id, natija: batafsilHisobla(vazifalar) });
};
