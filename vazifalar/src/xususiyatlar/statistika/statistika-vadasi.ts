// statistika-vadasi.ts — batafsil statistika Promise'i (18/#04). use()
// Promise'ni kutadi, lekin uni RENDERDA YANGIDAN yaratib bo'lmaydi: har
// render yangi Promise bersa, React har safar qayta to'xtaydi (cheksiz
// kutish). Shuning uchun — kesh: bir ro'yxat (massiv havolasi) — bitta
// Promise. Ro'yxat o'zgarmasa (reducer o'sha massivni qaytaradi) — kesh
// ishlaydi; WeakMap — eski ro'yxat unutilsa, Promise ham xotiradan ketadi
import { batafsilHisobla } from "./batafsil-statistika.ts";
import type { BatafsilStatistika } from "./batafsil-statistika.ts";
import type {
  IshchiJavobi,
  IshchiSorovi,
} from "./statistika-ishchi.ts";
import type { VazifaMalumoti } from "../../turlar.ts";
import { skriptManzili } from "../../xavfsiz-manzil.ts";
import ISHCHI_MANZILI from "./statistika-ishchi.ts?worker&url";

type Vazifalar = readonly VazifaMalumoti[];

const kesh = new WeakMap<Vazifalar, Promise<BatafsilStatistika>>();

// 18/#24: hisob — Web Worker'da (statistika-ishchi.ts). Ishchi bitta,
// birinchi kerak bo'lganda yaratiladi; har so'rovga id — javob o'z
// Promise'ini topadi (bir vaqtda bir nechta so'rov bo'lishi mumkin)
let ishchi: Worker | null = null;
let oxirgiId = 0;
const kutilmoqda = new Map<
  number,
  {
    hal: (natija: BatafsilStatistika) => void;
    rad: (xato: Error) => void;
  }
>();

function ishchiniOl(): Worker {
  if (ishchi !== null) {
    return ishchi;
  }
  // Trusted Types: new Worker() ham skript manzili — siyosatdan o'tadi
  // (oddiy satr CSP ostida TypeError). TS lib'idagi Worker konstruktori
  // TrustedScriptURL ni bilmaydi (uni kengaytirib bo'lmaydi — var turi)
  // — shu sabab "as". Dev'da Vite ishchini modul qilib beradi, build'da —
  // bitta oddiy skript (worker.format: iife)
  const yangi = new Worker(skriptManzili(ISHCHI_MANZILI) as string, {
    name: "statistika",
    type: import.meta.env.DEV ? "module" : "classic",
  });
  yangi.addEventListener(
    "message",
    (event: MessageEvent<IshchiJavobi>) => {
      const { id, natija } = event.data;
      kutilmoqda.get(id)?.hal(natija);
      kutilmoqda.delete(id);
    },
  );
  // Ishchi yiqilsa — kutayotganlar rad etiladi (panel chegarasi xabar
  // ko'rsatadi), keyingi so'rov yangi ishchi yaratadi
  yangi.addEventListener("error", (event) => {
    event.preventDefault();
    for (const { rad } of kutilmoqda.values()) {
      rad(new Error(`Statistika ishchisi: ${event.message}`));
    }
    kutilmoqda.clear();
    yangi.terminate();
    ishchi = null;
  });
  ishchi = yangi;
  return yangi;
}

function hisobla(vazifalar: Vazifalar): Promise<BatafsilStatistika> {
  // Worker yo'q muhit (Vitest — jsdom): asosiy oqimda, keyingi vazifada
  if (typeof Worker === "undefined") {
    return new Promise((hal) => {
      setTimeout(() => hal(batafsilHisobla(vazifalar)), 0);
    });
  }
  return new Promise((hal, rad) => {
    const id = ++oxirgiId;
    kutilmoqda.set(id, { hal, rad });
    // postMessage ro'yxatni nusxalaydi (structured clone)
    const sorov: IshchiSorovi = { id, vazifalar };
    ishchiniOl().postMessage(sorov);
  });
}

export function statistikaVadasi(
  vazifalar: Vazifalar,
): Promise<BatafsilStatistika> {
  let vada = kesh.get(vazifalar);
  if (vada === undefined) {
    vada = hisobla(vazifalar);
    kesh.set(vazifalar, vada);
    // Rad etilgan Promise keshda qolmasin: «Qayta urinish» (18/#08)
    // yangisini so'raydi, eskisini emas
    vada.catch(() => kesh.delete(vazifalar));
  }
  return vada;
}
