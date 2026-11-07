// turlar.ts — ilovaning ma'lumot shakllari. Faqat turlar: build'dan
// keyin bo'sh modul, brauzer uni yuklamaydi (import type).
// interface emas, type: JSON'dan kelgan oddiy obyekt Record<string,
// unknown> ga mos kelishi kerak (paket.ts tekshiruvi) — interface'ga
// yashirin index signature berilmaydi, type alias'ga beriladi

/** Vazifaning JSON'dagi shakli: eksport, kesh va server shu ko'rinishda */
export type VazifaMalumoti = {
  readonly id: number;
  readonly matn: string;
  readonly bajarildi: boolean;
};

/**
 * Eksport fayli va kesh (`localStorage`) matni. Shakl o'zgarsa —
 * versiya oshadi, eski matnlar rad etiladi
 */
export type Paket = {
  readonly versiya: 1;
  readonly vazifalar: readonly VazifaMalumoti[];
};

// Literal turlar union'i: qiymat faqat shulardan biri. Ro'yxatlar
// (FILTRLAR, SARALASHLAR) ham shu turda — biri o'zgarsa, ikkinchisi
// tsc xatosi bilan eslatadi
export type Filtr = "hammasi" | "faol" | "bajarilgan";
export type Saralash = "standart" | "yangi" | "alifbo";
export type TarmoqHolati = "yuklanmoqda" | "tayyor" | "xato" | "oflayn";

/** VazifaXatosi.kod: import/kesh matni nega rad etildi */
export type VazifaXatosiKodi =
  "JSON" | "TUZILMA" | "VERSIYA" | "VAZIFA" | "NOMALUM";

/** ApiXatosi.kod: so'rov nega bajarilmadi */
export type ApiXatosiKodi =
  | "TARMOQ" // internet yo'q, DNS, CORS
  | "VAQT" // 8 s ichida javob kelmadi
  | "BEKOR" // AbortController.abort()
  | "TOPILMADI" // 404
  | "NOTOGRI" // 400, 422
  | "SERVER" // 5xx
  | "HTTP" // boshqa xato status
  | "JAVOB" // tana JSON emas
  | "NOMALUM";

/**
 * Tablar orasidagi xabar (BroadcastChannel). Discriminated union:
 * `tur` maydoni qaysi variant ekanini aytadi. Hozir bitta variant;
 * yangisi qo'shilsa, uni qabul qiluvchi switch'dagi never tekshiruvi
 * "bu turni ishlamading" deb tsc xatosi beradi
 */
export type SinxronXabar =
  | {
      readonly tur: "ozgardi";
      readonly paket: string; // eksportMatni() natijasi
    }
  // 18/#42: kirish/chiqish — ma'lumotsiz ("o'zgardi" — qolganini har tab
  // o'z xotirasidan o'qiydi)
  | { readonly tur: "auth" };

/** Soxta kirish (18/#42): shu brauzerdagi ism — parol yo'q */
export type Foydalanuvchi = { readonly ism: string };

/**
 * Natija (Result): kutilgan xato ham qiymat — throw emas. `ok`
 * bo'yicha discriminated union: true bo'lsa `qiymat`, false bo'lsa
 * `xato` bor; ikkalasini tekshirmasdan olib bo'lmaydi
 */
export type Natija<T, E> =
  | { readonly ok: true; readonly qiymat: T }
  | { readonly ok: false; readonly xato: E };

/**
 * Ro'yxat qatoridagi hodisalar (17/#11). Ota komponent beradi, qator
 * chaqiradi: qator "nima bo'ldi"ni aytadi, "nima qilish"ni ota hal
 * qiladi. Nomlash: prop — onX, ishlovchi — fe'l (katakniAlmashtir)
 */
export type QatorAmallari = {
  readonly onAlmashtir: (id: number) => void;
  readonly onOchir: (id: number) => void;
  readonly onTahrirla: (id: number) => void;
  // tahrirdagi matn (17/#18); qaytadi — xato matni yoki null (17/#28)
  readonly onSaqla: (matn: string) => string | null;
  readonly onBekor: () => void;
  /**
   * Fokus uchun (17/#34): qator elementi (katak, tugma) shu funksiya
   * bergan ref callback bilan otaning ref Map'iga yoziladi
   */
  readonly tugmaRef: (
    id: number,
    amal: "almashtir" | "tahrirla" | "ochir" | "sudra", // 20/#17: tutqich
  ) => (element: HTMLElement | null) => (() => void) | undefined;
};

/**
 * Virtual ro'yxatdagi qator o'rni (18/#23): indeks — 0 dan, jami —
 * ro'yxatdagi hamma qator; olchov — vazifa id'si bo'yicha balandlikni
 * o'lchaydigan ref callback yasaydi (funksiyaning o'zi barqaror — memo)
 */
export type QatorJoyi = {
  readonly indeks: number;
  readonly jami: number;
  readonly olchov: (
    kalit: number,
  ) => (element: HTMLElement | null) => void;
};

/**
 * Yangi vazifa formasi yuborilganda nima bo'ldi (17/#12). Forma shunga
 * qarab maydonni tozalaydi yoki xatoni ko'rsatadi
 */
export type QoshishNatijasi =
  | { readonly tur: "qoshildi" } // maydon tozalanadi
  | { readonly tur: "saqlanmadi" } // internet yo'q — matn maydonda qoladi
  | { readonly tur: "xato"; readonly xabar: string };
