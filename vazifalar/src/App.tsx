// App.tsx — butun ilova (17/#28). Holat — shu komponentning state'i
// (v6 dagi mutable "holat" obyekti va render() yo'q): o'zgartirish —
// setX(), qayta chizishni React o'zi qiladi. Tashqi tizimlar —
// localStorage, boshqa tablar, server, URL, internet — effektlar orqali
import {
  lazy,
  Profiler,
  startTransition,
  Suspense,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router";
import { ArrowUpDown, ListTodo } from "lucide-react";
import { kochir } from "./tartib.ts";
import { Tugma } from "@/ui/Tugma.tsx";
import { chiqishAnimatsiyasi } from "./ui/qator-harakati.ts";
import { Aloqa } from "./komponentlar/Aloqa.tsx";
import { Eksport } from "./komponentlar/Eksport.tsx";
import { Filtrlar } from "./komponentlar/Filtrlar.tsx";
import { Import } from "./komponentlar/Import.tsx";
import { Izoh } from "./komponentlar/Izoh.tsx";
import { OchirishDialog } from "./komponentlar/OchirishDialog.tsx";
import { QidiruvMaydoni } from "./komponentlar/QidiruvMaydoni.tsx";
import { SaralashTanlovi } from "./komponentlar/SaralashTanlovi.tsx";
import { Statistika } from "./komponentlar/Statistika.tsx";
import { StatistikaPaneli } from "./xususiyatlar/statistika/index.ts";
import { TemaTanlov } from "./komponentlar/TemaTanlov.tsx";
import { VazifaRoyxati } from "./komponentlar/VazifaRoyxati.tsx";
import { XatoChegarasi } from "./komponentlar/XatoChegarasi.tsx";
import { YangiVazifaForma } from "./komponentlar/YangiVazifaForma.tsx";
import { QatorAmallariKonteksti } from "./kontekst/qator-amallari.ts";
import { useIlovaHolati } from "./ilova-holati.ts";
import { useOnlayn } from "./hooklar/useOnlayn.ts";
import { useOynaHodisasi } from "./hooklar/useOynaHodisasi.ts";
import { useUrlTanlovi } from "./hooklar/useUrlTanlovi.ts";
import { faylniYuklabBer, joyTanlabSaqla } from "./fayl.ts";
import { vazifalarCsv } from "./csv.ts";
import { hodisa } from "./kuzatuv/analitika.ts";
import { navbatgaQosh } from "./navbat.ts";
import type { NavbatAmali } from "./navbat.ts";
import {
  korinadiganVazifalar,
  qoshilgandaKorinsin,
  qoshniId,
  xatoniTop,
} from "./holat.ts";
import {
  eksportFaylNomi,
  eksportMatni,
  paketniTekshir,
} from "./paket.ts";
import { chizildi } from "./profil.ts";
import { normalla } from "./qidiruv.ts";
import { VazifalarRoyxati } from "./royxat.ts";
import { boshlangichHolat, vazifalarReducer } from "./reducer.ts";
import type { VazifaAmali } from "./reducer.ts";
import { qoralamaniSaqla, saqla } from "./saqlash.ts";
import { SARALASHLAR } from "./saralash.ts";
import { useQueryClient } from "@tanstack/react-query";
import {
  api,
  royxatKaliti,
  tasdiqniQoy,
  useVazifalar,
  useYozuv,
} from "./server-sinxron.ts";
import { AUTH, OZGARDI, tingla } from "./sinxron.ts";
import { kechiktir } from "./taymer.ts";
import { tegDaraxtiniQur, tegTakliflari } from "./teglar.ts";
import type {
  Filtr,
  QatorAmallari,
  QoshishNatijasi,
  SinxronXabar,
  TarmoqHolati,
  VazifaMalumoti,
} from "./turlar.ts";

// Record<Filtr, string>: har filtrga matn — biri unutilsa, tsc aytadi
const boshMatnlar: Readonly<Record<Filtr, string>> = Object.freeze({
  hammasi: "Hozircha vazifa yo'q. Birinchisini qo'shing!",
  faol: "Faol vazifa yo'q.",
  bajarilgan: "Bajarilgan vazifa hali yo'q.",
});

// Qoralama har harfda emas, yozish to'xtagach bir marta saqlanadi:
// localStorage sinxron — har harfda yozish kiritishni sekinlatadi
const QORALAMA_KUTISH_MS = 400;
const qoralamaniKechiktir = kechiktir(
  qoralamaniSaqla,
  QORALAMA_KUTISH_MS,
);

// Fokus qo'yiladigan qator elementlari (ref Map kaliti)
// 20/#17: «Tartiblash» rejimi — dnd-kit faqat shu chunk'da. Modul Promise'i
// bitta (StatistikaPaneli.tsx dagidek): oldindan yuklash va lazy()
let tartiblashModuli: Promise<
  typeof import("./komponentlar/TartiblashRejimi.tsx")
> | null = null;
function tartiblashModuliniOl() {
  tartiblashModuli ??= import("./komponentlar/TartiblashRejimi.tsx");
  return tartiblashModuli;
}
const TartiblashRejimi = lazy(tartiblashModuliniOl);
function tartiblashniOldindanYukla() {
  tartiblashModuliniOl().catch(() => {});
}

type FokusAmali = "almashtir" | "tahrirla" | "ochir" | "sudra";

// Qator hodisalari — tugmaRef'siz (u ref Map'ga yozadi, state o'qimaydi)
type QatorHodisalari = Omit<QatorAmallari, "tugmaRef">;

// Ref callback (17/#34): React elementni qo'yganda chaqiradi, qaytargan
// funksiyasini — element olib tashlanganda (React 19: ref cleanup).
// 18/#02 dan komponentdan tashqarida: faqat ref Map bilan ishlaydi
function tugmaRef(
  tugmalar: RefObject<Map<string, HTMLElement>>,
  id: number,
  amal: FokusAmali,
) {
  return (element: HTMLElement | null) => {
    if (element === null) {
      return undefined;
    }
    const kalit = `${id}:${amal}`;
    tugmalar.current.set(kalit, element);
    return () => {
      tugmalar.current.delete(kalit);
    };
  };
}

// useOptimistic'ning yangilash funksiyasi (18/#07): asosiy ro'yxat +
// kutilayotgan amal → ekrandagi ro'yxat. O'sha sof reducer.
// 19/#13: asosiy ro'yxat endi Query keshida (tashqi store) — tasdiq
// keshga action tugashidan OLDIN tushadi va React kutilayotgan amalni
// YANGI ro'yxat ustiga qayta qo'llaydi. Shuning uchun amal ikki marta
// qo'llansa ham natija o'sha bo'lishi kerak: "qoshildi" — shu matnli
// vazifa allaqachon bo'lsa (server tasdiqlagan), yana qo'shilmaydi
// (bir xil matnli ikki vazifa baribir bo'lmaydi — xatoniTop)
function optimistikOzgartir(
  vazifalar: readonly VazifaMalumoti[],
  amal: VazifaAmali,
): readonly VazifaMalumoti[] {
  if (
    amal.tur === "qoshildi" &&
    vazifalar.some((v) => v.matn === amal.matn)
  ) {
    return vazifalar;
  }
  return vazifalarReducer(boshlangichHolat(vazifalar), amal).vazifalar;
}

// Fokus rejasi (18/#07): qaysi element — keyingi commit'dan keyin
type FokusRejasi = {
  id: number | null;
  amal: FokusAmali;
  zaxira: number | null;
};

// O'chirish so'ralayotgan vazifa: zaxira — o'chsa fokus qaysi qatorga
type OchirishSorovi = {
  id: number;
  matn: string;
  zaxira: number | null;
};

type Props = {
  boshlangichRoyxat: readonly VazifaMalumoti[]; // localStorage'dan
  qoralama: string; // forma ochilgandagi matn
  // 19/#02: «Ro'yxat» sarlavhasi — layout'ning ref'i (skip link endi
  // Qobiq'da, fokusni shu sarlavhaga qo'yadi). 18/#42 dagi "yuqori" slot
  // (foydalanuvchi menyusi) ham Qobiq'ga ko'chdi. Testlarda berilmaydi
  sarlavhaRef?: RefObject<HTMLHeadingElement | null>;
};

export function App({
  boshlangichRoyxat,
  qoralama,
  sarlavhaRef,
}: Props) {
  // 19/#13: SERVER holati — Query keshida (server-sinxron.ts): ro'yxat,
  // aloqa holati, qayta urinish. 17/#39 dagi useReducer'da endi faqat
  // mijoz (client) holati qolardi — tahrirdagi vazifa — u oddiy state
  const mijoz = useQueryClient();
  const {
    vazifalar: asosiy,
    tarmoq,
    qaytaUrin,
  } = useVazifalar(boshlangichRoyxat);
  const yoz = useYozuv();
  const [tahrirIdXom, setTahrirId] = useState<number | null>(null);
  // Tahrirdagi vazifani server yoki boshqa tab o'chirgan bo'lsa — tahrir
  // yo'q (17/#39 da reducer'ning "royxatKeldi" i shunday qilardi)
  const tahrirId =
    tahrirIdXom !== null && asosiy.some((v) => v.id === tahrirIdXom)
      ? tahrirIdXom
      : null;
  const tahrirniYop = () => setTahrirId(null);
  // useOptimistic (18/#07): ekrandagi ro'yxat = asosiy (server tasdiqlagan)
  // + hali kutilayotgan yozuvlar. Action tugagach optimistik qatlam
  // olinadi: tasdiqlangan bo'lsa — asosiyda allaqachon bor, rad
  // etilgan bo'lsa — o'z-o'zidan yo'qoladi (qaytarish avtomatik)
  const [vazifalar, optimistik] = useOptimistic(
    asosiy,
    optimistikOzgartir,
  );
  // Filtr va saralash — URL'dan (useSyncExternalStore, 17/#38): state'da
  // nusxasi yo'q. 17/#43 dan — custom hook ichida
  // 19/#09: URL — React Router'da; yozish ham shu hook orqali
  const { filtr, saralash, filtrniYoz, saralashniYoz } =
    useUrlTanlovi();
  const [qidiruv, setQidiruv] = useState("");
  // Internet yo'q bo'lsa — server holati qanday bo'lmasin, "oflayn"
  const aloqa: TarmoqHolati = useOnlayn() ? tarmoq : "oflayn";
  // E'lon — 19/#21 dan Zustand store'da: ekranda — Qobiq'dagi
  // Bildirishnoma. App faqat yozadi (elonQil — barqaror funksiya; e'lon
  // matni o'zgarsa App qayta chizilmaydi). 18/#05 dagi optimistik e'lon
  // kerak emas: store yozuvi action ichida ham darhol chiziladi
  const elonQil = useIlovaHolati((h) => h.elonQil);
  // 19/#22: foydalanuvchi sozlamalari (Sozlamalar sahifasi)
  const ochirishdaSora = useIlovaHolati((h) => h.ochirishdaSora);
  const zichlik = useIlovaHolati((h) => h.zichlik);
  const [ochirilayotgan, setOchirilayotgan] =
    useState<OchirishSorovi | null>(null);

  // useId (17/#37): sarlavha va ro'yxatni bog'lovchi (aria-labelledby)
  // noyob id — qo'lda o'ylab topilgan "royxat-sarlavha" o'rniga. Komponent
  // ikki marta chizilsa ham to'qnashmaydi; key uchun ishlatilmaydi
  const sarlavhaId = useId();
  const tartiblashIzohId = useId();

  // --- Ref'lar (17/#33–#34): o'zgarsa qayta chizilmaydigan xotira ---
  // DOM elementlari: React commit'dan keyin .current ga qo'yadi
  const royxatRef = useRef<HTMLUListElement>(null);
  const ichkiSarlavha = useRef<HTMLHeadingElement>(null);
  const sarlavha = sarlavhaRef ?? ichkiSarlavha;
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Qatorlardagi katak va tugmalar: "id:amal" → element. Ro'yxat uchun
  // bitta ref Map — har qatorga alohida useRef yozib bo'lmaydi
  const tugmalar = useRef(new Map<string, HTMLElement>());
  const fokusRejasi = useRef<FokusRejasi | null>(null);

  // --- Fokus (17/#34): DOM — ref'lar orqali, id bilan qidirmasdan ---

  // id null — qo'shni qator yo'q: fokus sarlavhaga. DOM yangilangan
  // bo'lishi kerak (commit'dan keyin)
  function fokusla(
    id: number | null,
    amal: string | undefined,
    zaxiraId: number | null,
  ) {
    const topilgan = (qatorId: number | null) =>
      tugmalar.current.get(`${qatorId}:${amal}`);
    (topilgan(id) ?? topilgan(zaxiraId) ?? sarlavha.current)?.focus();
  }

  // 18/#07: fokus REJALASHTIRILADI, keyingi commit'dan keyin qo'yiladi
  // (useLayoutEffect — bo'yashdan oldin). v7 da flushSync + focus() edi;
  // optimistik yangilanishni esa flushSync bilan chizib bo'lmaydi — u
  // transition ichida. Qator joyi o'zgarsa (saralash), React <li> ni
  // ko'chiradi va fokus tushib qoladi — shu effekt qaytaradi
  function fokusniRejala(
    id: number | null,
    amal: FokusAmali,
    zaxira: number | null,
  ) {
    fokusRejasi.current = { id, amal, zaxira };
  }
  useLayoutEffect(() => {
    const reja = fokusRejasi.current;
    if (reja !== null) {
      fokusRejasi.current = null;
      fokusla(reja.id, reja.amal, reja.zaxira);
    }
  });

  // Fon yangilanishi (boshqa tab): React qatorni key bo'yicha saqlaydi —
  // fokus va tahrirdagi matn o'z-o'zidan joyida. Faqat fokusdagi qator
  // yo'qolsa (boshqa tab o'chirgan) — qo'shni yoki sarlavha
  function fondaYangila(yangila: () => void) {
    const fokusdagi = document.activeElement;
    const ichida =
      fokusdagi instanceof HTMLElement &&
      (royxatRef.current?.contains(fokusdagi) ?? false);
    const id = ichida
      ? Number(fokusdagi.closest("li")?.dataset.id)
      : null;
    const amal = ichida ? fokusdagi.dataset.amal : undefined;
    flushSync(yangila);
    if (ichida && !fokusdagi.isConnected) {
      fokusla(id, amal, null);
    }
  }

  // --- Effektlar: render'dan KEYIN, tashqi tizim bilan sinxronlash ---

  // #26: localStorage — ro'yxat qayerdan o'zgarmasin (forma, server,
  // boshqa tab, qaytarish), xotiradagi nusxa unga ergashadi
  // 18/#07: faqat ASOSIY (tasdiqlangan) ro'yxat — optimistik emas
  useEffect(() => {
    saqla(asosiy);
  }, [asosiy]);

  // #28: boshqa tablar. Kelgan ro'yxat saqlanadi (effekt yuqorida),
  // lekin QAYTA YUBORILMAYDI: yuborsak, tablar bir-biriga cheksiz
  // javob qaytaradi (aks-sado — o'lchandi, 17/#30). Effekt hodisasi
  // (#31): fondaYangila — komponent ichidagi funksiya, effekt esa
  // obunani har renderda qayta ulamasin
  const tabdanKeldi = useEffectEvent((xabar: SinxronXabar) => {
    switch (xabar.tur) {
      case OZGARDI: {
        const natija = paketniTekshir(xabar.paket);
        if (!natija.ok) {
          console.warn(
            `Boshqa tab xabari o'qilmadi: ${natija.xato.message}`,
          );
          return;
        }
        // 19/#13: keshga (serverga qayta so'ramaymiz — u tabda bor edi)
        fondaYangila(() =>
          mijoz.setQueryData<readonly VazifaMalumoti[]>(
            royxatKaliti,
            natija.qiymat,
          ),
        );
        return;
      }
      case AUTH:
        return; // 18/#42: kirish/chiqish — AuthProvider o'zi tinglaydi
      default: {
        // Hamma variant ishlandi — xabar endi never (18/#42 da "auth"
        // qo'shilganda shu qator tsc xatosi bilan eslatdi)
        const qolmadi: never = xabar;
        void qolmadi;
      }
    }
  });

  // Cleanup — obunani bekor qiladi
  useEffect(() => tingla((xabar) => tabdanKeldi(xabar)), []);

  // 17/#28 dagi "ochilganda serverdan" effekti va "online" hodisasi —
  // 19/#13 dan Query'da (refetchOnMount, refetchOnReconnect). Internet
  // uzildi — yo'ldagi so'rov endi kerak emas
  useOynaHodisasi("offline", () => {
    void mijoz.cancelQueries({ queryKey: royxatKaliti });
  });
  // Orqaga/Oldinga: filtr va saralashni useUrlTanlovi o'zi o'qiydi; bu
  // yerda — faqat tahrirni yopish (v6 dagidek)
  useOynaHodisasi("popstate", tahrirniYop);
  // Sahifa yopilsa yoki yangilansa — kutib turgan qoralama yo'qolmasin
  useOynaHodisasi("pagehide", () => qoralamaniKechiktir.hoziroq());

  // --- Hosilaviy qiymatlar (17/#15): har renderda hisoblanadi ---
  const royxat = useMemo(
    () => VazifalarRoyxati.dan(vazifalar),
    [vazifalar],
  );
  // 18/#02 (useDeferredValue): maydon (qidiruv) — shoshilinch, har harfda
  // darhol; ro'yxat — KECHIKTIRILGAN so'rov bilan. React avval maydonni
  // eski ro'yxat bilan chizadi, keyin fonda yangi ro'yxatni; yangi harf
  // kelsa — fondagi ishni tashlab, qaytadan. 10 000 vazifada o'lchandi
  // (natijalar/02-qidiruv.txt, mediana): eng uzun javob 1 184 → 208 ms,
  // ishlovchi 1 024 → 62 ms. useTransition (#01, ikki state) — 168 ms:
  // farq shovqin ichida, bu esa bitta state bilan soddaroq
  const sorov = useDeferredValue(qidiruv);
  const eskirgan = sorov !== qidiruv; // ekranda hali eski natija
  // useMemo: kechiktirish faqat qimmat qism QAYTA CHIZILMASA foyda
  // beradi — shoshilinch renderda massiv o'sha bo'lsin (memo'li
  // VazifaRoyxati uni solishtiradi)
  const korinadigan = useMemo(
    () => korinadiganVazifalar(vazifalar, filtr, saralash, sorov),
    [vazifalar, filtr, saralash, sorov],
  );
  // 18/#20: ro'yxatdan hisoblanadigan hamma narsa — faqat ro'yxat
  // o'zgarganda (qidiruvda har harfda emas). Teglar Trie'si — O(T · l)
  const { qoldi, bajarildi, teglar, yopilgan, daraxt } = useMemo(() => {
    const teglar = royxat.tegHisobi();
    return {
      ...royxat.statistika(),
      teglar,
      yopilgan: royxat.yopilganTeglar(),
      daraxt: tegDaraxtiniQur(teglar),
    };
  }, [royxat]);

  // --- 20/#17: «Tartiblash» rejimi (dnd-kit, kerak bo'lganda yuklanadi) ---
  // Qachon: "standart" tartib (massiv tartibi — qo'lda tartib shu), qidiruv
  // bo'sh (bo'lmasa joy noaniq), tahrir yopiq, 2–200 qator (200 dan ko'p —
  // virtual ro'yxat, 18/#23: ko'rinmaydigan qatorlar DOM'da yo'q)
  const sudrashMumkin =
    saralash === "standart" &&
    normalla(sorov) === "" &&
    tahrirId === null &&
    korinadigan.length > 1 &&
    korinadigan.length <= 200;
  // Rejim — tugma bilan (aria-pressed). Shart buzilsa (qidiruv yozildi,
  // boshqa tartib) — rejim o'z-o'zidan o'chadi, qaytsa — yana yoqiladi
  const [tartiblash, setTartiblash] = useState(false);
  const tartiblashFaol = tartiblash && sudrashMumkin;

  // Qo'yildi (A — B ning joyiga): yangi tartib — avval ekranda
  // (optimistik), keyin serverda (PUT — butun ro'yxat, import kabi).
  // localStorage — asosiy ro'yxat effekti orqali (#26). Fokus — tutqichda
  // (qator DOM'da ko'chadi)
  function tartibniOzgartir(aId: number, bId: number) {
    const natija = kochir(vazifalar, korinadigan, aId, bId);
    if (!natija.ok) {
      if (natija.sabab === "boshqa-guruh") {
        elonQil("Faol va bajarilgan vazifalar alohida tartiblanadi.");
      }
      return;
    }
    if (!onlaynmi()) {
      return;
    }
    const yangi = natija.vazifalar;
    fokusniRejala(aId, "sudra", null);
    fondaYoz({ tur: "royxatKeldi", vazifalar: yangi }, async () => ({
      tur: "royxatKeldi",
      vazifalar: (await api.almashtir(yangi)).vazifalar,
    }));
  }

  // --- Hodisalar ---

  // --- Yozuvlar (18/#05–#07): action — async transition ---

  // Internet yo'q — yozuv boshlanmaydi (e'lon bilan)
  function onlaynmi(): boolean {
    if (aloqa === "oflayn") {
      elonQil("Internet yo'q — o'zgarish saqlanmaydi.");
      return false;
    }
    return true;
  }

  // Optimistik yozuv: avval ekranda (useOptimistic), keyin serverda.
  // TRANSITION ICHIDA chaqiriladi (useOptimistic talabi): forma action'i
  // — React o'zi, qolganlari — fondaYoz(). Rad etilsa — e'lon; ekrandagi
  // o'zgarish action tugagach o'zi qaytadi
  async function yozuv(
    amal: VazifaAmali,
    serverda: () => Promise<VazifaAmali>,
    navbat?: (royxat: readonly VazifaMalumoti[]) => NavbatAmali,
  ): Promise<boolean> {
    // 21/#29: internet yo'q — rad etilmaydi: keshga (ekran, localStorage,
    // boshqa tablar) darhol, serverga — navbatga (navbat.ts). Qaytganda
    // Query qayta so'raydi va navbat avval yuboriladi (server-sinxron.ts)
    if (aloqa === "oflayn" && navbat !== undefined) {
      tasdiqniQoy(mijoz, amal);
      const royxat =
        mijoz.getQueryData<readonly VazifaMalumoti[]>(royxatKaliti) ??
        [];
      navbatgaQosh(navbat(royxat));
      elonQil(
        "Internet yo'q — o'zgarish navbatda, qaytganda yuboriladi.",
      );
      return true;
    }
    optimistik(amal);
    const natija = await yoz(serverda); // 19/#15: useMutation
    if (!natija.ok) {
      elonQil(natija.xabar);
    }
    return natija.ok;
  }

  // Hodisa ishlovchisidan (katak, tahrir, o'chirish, import): action'ni
  // o'zimiz boshlaymiz. Async funksiya startTransition ichida — React 19
  function fondaYoz(
    amal: VazifaAmali,
    serverda: () => Promise<VazifaAmali>,
    navbat?: (royxat: readonly VazifaMalumoti[]) => NavbatAmali,
  ) {
    startTransition(async () => {
      await yozuv(amal, serverda, navbat);
    });
  }

  // Server javobidagi vazifa (api.ts tekshirgan, 19/#12) — asosiy
  // holatga (server id)
  async function serverVazifasi(
    sorov: Promise<VazifaMalumoti>,
  ): Promise<VazifaAmali> {
    return { tur: "serverdanKeldi", vazifa: await sorov };
  }

  // Forma action'i (YangiVazifaForma) chaqiradi — transition ichida.
  // Server javobigacha kutadi: forma shu paytgacha "kutilmoqda", keyin
  // tozalanadi; rad etilsa — matn maydonda qoladi
  async function vazifaniQosh(matn: string): Promise<QoshishNatijasi> {
    elonQil("");
    const xato = xatoniTop(matn, royxat, null);
    if (xato !== null) {
      return { tur: "xato", xabar: xato };
    }
    const korinsin = qoshilgandaKorinsin(matn, filtr, qidiruv);
    const xabar = `«${matn}» qo'shildi.`;
    elonQil(xabar); // darhol; rad etilsa — "Saqlanmadi" bilan almashadi
    const qoshildi = await yozuv(
      { tur: "qoshildi", matn },
      () => serverVazifasi(api.qosh(matn)),
      // 21/#29: oflayn — mahalliy id (reducer bergan) bilan navbatga
      (royxat) => ({
        tur: "qosh",
        id: royxat.find((v) => v.matn === matn)?.id ?? 0,
        matn,
      }),
    );
    if (!qoshildi) {
      return { tur: "saqlanmadi" };
    }
    // await'dan keyin — yana transition (action bilan birga tugasin)
    startTransition(() => {
      setQidiruv(korinsin.qidiruv);
    });
    filtrniYoz(korinsin.filtr);
    // Kutayotgan saqlash eski matnni qaytarib yozmasin
    qoralamaniKechiktir.bekor();
    qoralamaniSaqla("");
    hodisa("vazifa_qoshildi"); // 21/#18: matnsiz — faqat "nima bo'ldi"
    return { tur: "qoshildi" };
  }

  // Qiymat bosilgan paytda olinadi: serverga aynan shu yuboriladi.
  // Optimistik amal — "serverdanKeldi" (yangi qiymat bilan): ikki marta
  // qo'llansa ham natija o'sha ("almashtir" ikki marta — teskarisi)
  function katakniAlmashtir(id: number) {
    elonQil("");
    tahrirniYop();
    const vazifa = vazifalar.find((v) => v.id === id);
    if (vazifa === undefined) {
      return;
    }
    const yangi = {
      id,
      matn: vazifa.matn,
      bajarildi: !vazifa.bajarildi,
    };
    fokusniRejala(id, "almashtir", qoshniId(korinadigan, id));
    fondaYoz(
      { tur: "serverdanKeldi", vazifa: yangi },
      () =>
        serverVazifasi(api.yangila(id, { bajarildi: yangi.bajarildi })),
      () => ({
        tur: "yangila",
        id,
        nomi: vazifa.matn,
        maydonlar: { bajarildi: yangi.bajarildi },
      }),
    );
  }

  function tahrirniBoshla(id: number) {
    elonQil("");
    // Fokus va belgilash — TahrirQatori'ning effekti
    setTahrirId(id);
  }

  // Matn — TahrirQatori state'idan. Xato bo'lsa — matni qaytadi
  function tahrirniSaqla(yangiMatn: string): string | null {
    const id = tahrirId;
    if (id === null) {
      return null; // tahrir yopilgan — saqlanadigan narsa yo'q
    }
    const matn = yangiMatn.trim();
    const xato = xatoniTop(matn, royxat, id);
    if (xato !== null) {
      elonQil(xato); // fokus — TahrirQatori o'zi (ref)
      return xato;
    }
    // Tahrir yopiladi (asosiy holat), yangi matn — optimistik
    tahrirniYop();
    fokusniRejala(id, "tahrirla", null);
    elonQil("O'zgarish saqlandi.");
    const eski = vazifalar.find((v) => v.id === id)?.matn ?? matn;
    fondaYoz(
      { tur: "matnOzgardi", id, matn },
      () => serverVazifasi(api.yangila(id, { matn })),
      () => ({ tur: "yangila", id, nomi: eski, maydonlar: { matn } }),
    );
    return null;
  }

  function tahrirniBekorQil() {
    const id = tahrirId;
    tahrirniYop();
    if (id !== null) {
      fokusniRejala(id, "tahrirla", null);
    }
  }

  function ochirishniSora(id: number) {
    elonQil("");
    tahrirniYop();
    const vazifa = vazifalar.find((v) => v.id === id);
    if (vazifa === undefined) {
      return;
    }
    const zaxira = qoshniId(korinadigan, id);
    // 19/#22: sozlamada "so'ramasin" tanlangan — darhol
    if (!ochirishdaSora) {
      ochir({ id, matn: vazifa.matn, zaxira });
      return;
    }
    flushSync(() =>
      setOchirilayotgan({ id, matn: vazifa.matn, zaxira }),
    );
    // Dialogni ochish — DOM metodi (showModal), ref orqali
    if (dialogRef.current !== null) {
      dialogRef.current.returnValue = "";
      dialogRef.current.showModal();
    }
  }

  // Dialog yopildi (close hodisasi). Bu funksiya ENG SO'NGGI renderdagi
  // vazifalar bilan ishlaydi: dialog ochiq turganda boshqa tab yoki
  // server vazifani o'chirgan bo'lsa — o'chirilmaydi
  function ochirishJavobi(tasdiq: boolean) {
    if (ochirilayotgan === null) {
      return;
    }
    const { id, zaxira } = ochirilayotgan;
    const bor = vazifalar.some((v) => v.id === id);
    if (tasdiq && bor) {
      ochir(ochirilayotgan);
      return;
    }
    // Ekranda hech narsa o'zgarmaydi — fokus darhol, tugma joyida
    fokusla(id, "ochir", zaxira);
  }

  // O'chirish: dialog tasdiqlagan yoki sozlamada "so'ramasin" (19/#22)
  function ochir({ id, matn, zaxira }: OchirishSorovi) {
    // 20/#25: avval qator ko'rinishdan chiqadi (150 ms), keyin o'chadi
    const li =
      tugmalar.current.get(`${id}:ochir`)?.closest("li") ?? null;
    void chiqishAnimatsiyasi(li).then(() =>
      ochirishniBajar({ id, matn, zaxira }),
    );
  }

  function ochirishniBajar({ id, matn, zaxira }: OchirishSorovi) {
    const amal = { tur: "ochirildi", id } as const;
    elonQil(`«${matn}» o'chirildi.`);
    fokusniRejala(zaxira, "ochir", null);
    fondaYoz(
      amal,
      async () => {
        await api.ochir(id);
        return amal;
      },
      () => ({ tur: "ochir", id, nomi: matn }),
    );
  }

  function filtrniTanla(yangi: Filtr) {
    elonQil("");
    tahrirniYop();
    filtrniYoz(yangi);
  }

  function saralashniTanla(qiymat: string) {
    elonQil("");
    const yangi = SARALASHLAR.find((tartib) => tartib === qiymat);
    if (yangi === undefined) {
      return; // <option> qiymatini DevTools'da o'zgartirish mumkin
    }
    tahrirniYop();
    saralashniYoz(yangi);
  }

  // Har harfda darhol, kechiktirishsiz (debounce yo'q): qidiruv
  // xotiradagi ro'yxatda, tarmoq va localStorage'ga tegmaydi
  function qidiruvniYangila(matn: string) {
    setQidiruv(matn);
    tahrirniYop();
  }

  // Import: ro'yxat almashadi, filtr "hammasi" ga, qidiruv tozalanadi —
  // import qilingan hamma vazifa ko'rinsin
  function importQil(matn: string): string | null {
    elonQil("");
    const natija = paketniTekshir(matn);
    if (!natija.ok) {
      return natija.xato.message;
    }
    const malumotlar = natija.qiymat;
    if (!onlaynmi()) {
      return null;
    }
    setQidiruv("");
    tahrirniYop();
    filtrniYoz("hammasi");
    elonQil(`${malumotlar.length} ta vazifa import qilindi.`);
    fondaYoz(
      { tur: "royxatKeldi", vazifalar: malumotlar },
      async () => ({
        tur: "royxatKeldi",
        vazifalar: (await api.almashtir(malumotlar)).vazifalar,
      }),
    );
    return null;
  }

  function eksportJson(): string {
    elonQil("JSON tayyor. Nusxa olish uchun Ctrl+C bosing.");
    return eksportMatni(asosiy); // tasdiqlangan ro'yxat
  }

  // 21/#15: CSV — Excel'da ochiladi (BOM, CRLF, formula himoyasi — csv.ts)
  function eksportCsv() {
    const nomi = eksportFaylNomi().replace(/\.json$/, ".csv");
    faylniYuklabBer(
      vazifalarCsv(asosiy),
      nomi,
      "text/csv;charset=utf-8",
    );
    hodisa("eksport_csv");
    elonQil(`${nomi} yuklab olindi.`);
  }

  // 21/#17: fayl qayerga saqlanishini foydalanuvchi tanlaydi (Chrome/Edge)
  async function eksportJoyTanlab() {
    const natija = await joyTanlabSaqla(
      eksportMatni(asosiy),
      eksportFaylNomi(),
    );
    elonQil(
      natija.tur === "bekor"
        ? "Saqlash bekor qilindi."
        : `${natija.nomi} saqlandi.`,
    );
  }

  function eksportFayl() {
    const nomi = eksportFaylNomi();
    faylniYuklabBer(eksportMatni(asosiy), nomi);
    elonQil(`${nomi} yuklab olindi.`);
  }

  // 18/#02: qator hodisalari — BARQAROR obyekt. Context qiymati har
  // renderda yangi bo'lsa, har harfda hamma qator qayta chiziladi (memo
  // ham to'xtatmaydi: context o'zgarsa, iste'molchi baribir chiziladi).
  // Ishlovchilar esa ENG SO'NGGI state bilan ishlashi kerak: ular ref'da
  // (commit'dan keyin yoziladi), obyektdagi funksiyalar — doim o'sha,
  // chaqirilganda ref'dagini chaqiradi ("latest ref" naqshi)
  const songgiAmallar = useRef<QatorHodisalari | null>(null);
  const amallar: QatorHodisalari = {
    onAlmashtir: katakniAlmashtir,
    onOchir: ochirishniSora,
    onTahrirla: tahrirniBoshla,
    onSaqla: tahrirniSaqla,
    onBekor: tahrirniBekorQil,
  };
  useLayoutEffect(() => {
    songgiAmallar.current = amallar;
  });
  const barqarorAmallar = useMemo<QatorAmallari>(() => {
    const ol = (): QatorHodisalari => {
      if (songgiAmallar.current === null) {
        throw new Error("Qator hodisasi commit'dan oldin chaqirildi");
      }
      return songgiAmallar.current;
    };
    return {
      onAlmashtir: (id) => ol().onAlmashtir(id),
      onOchir: (id) => ol().onOchir(id),
      onTahrirla: (id) => ol().onTahrirla(id),
      onSaqla: (matn) => ol().onSaqla(matn),
      onBekor: () => ol().onBekor(),
      // Render paytida chaqiriladi (ref callback yasaydi) — ref'ga
      // tegmaydi, faqat qaytargan callback commit'da Map'ga yozadi
      tugmaRef: (id, amal) => tugmaRef(tugmalar, id, amal),
    };
  }, []);

  // 20/#17: ro'yxat — oddiy va «Tartiblash» rejimida bir xil (rejimda
  // TartiblashRejimi ichiga o'raladi)
  const royxatTarkibi = (
    <QatorAmallariKonteksti value={barqarorAmallar}>
      {/* Profiler (18/#22): ro'yxat qancha vaqt chizildi — faqat
          dev va build:profil'da o'lchaydi (profil.ts) */}
      <Profiler id="royxat" onRender={chizildi}>
        <VazifaRoyxati
          vazifalar={korinadigan}
          sorov={sorov}
          tahrirId={tahrirId}
        />
      </Profiler>
    </QatorAmallariKonteksti>
  );

  return (
    <>
      {/* 18/#12: hujjat sarlavhasi komponentdan — React 19 uni <head> ga
          ko'taradi (hoisting). Tabda nechta vazifa qolgani ko'rinadi */}
      <title>{`(${qoldi}) Vazifalar — kichik vazifalar ro'yxati`}</title>
      {/* Skip link (18/#40) va foydalanuvchi menyusi (18/#42) — 19/#02
          dan layout'da (sahifalar/Qobiq.tsx) */}
      <Aloqa tarmoq={aloqa} onQaytaUrin={qaytaUrin} />
      <YangiVazifaForma
        boshlangichMatn={qoralama}
        xatoniTop={(matn) => xatoniTop(matn, royxat, null)}
        takliflarniTop={(joriy) => tegTakliflari(daraxt, joriy)}
        onYoz={qoralamaniKechiktir}
        onQosh={vazifaniQosh}
      />
      {/* 19/#33: katta ish — qadamlarga bo'lib (ko'p qadamli forma) */}
      <p className="izoh">
        <Link to="/yangi" id="usta-havola">
          Katta ishni qadamlarga bo'lib qo'shish…
        </Link>
      </p>
      <QidiruvMaydoni
        qidiruv={qidiruv}
        topildi={normalla(sorov) === "" ? null : korinadigan.length}
        onQidir={qidiruvniYangila}
      />
      <Filtrlar filtr={filtr} onFiltr={filtrniTanla} />
      <SaralashTanlovi
        saralash={saralash}
        onSaralash={saralashniTanla}
      />
      {/* 20/#17: «Tartiblash» rejimi — yoqilganda qatorlarda tutqich
          paydo bo'ladi (dnd-kit shu paytda yuklanadi). Transition: chunk
          kelguncha eski ro'yxat ko'rinib turadi (Suspense fallback'iga
          almashmaydi). Sichqoncha ustiga kelsa — oldindan yuklash */}
      <p
        id="tartiblash-qatori"
        className="flex flex-wrap items-center gap-2"
      >
        <Tugma
          id="tartiblash-tugma"
          aria-pressed={tartiblashFaol}
          aria-describedby={
            sudrashMumkin ? undefined : tartiblashIzohId
          }
          disabled={!sudrashMumkin}
          variant={tartiblashFaol ? "asosiy" : "oddiy"}
          className="inline-flex items-center gap-2"
          onPointerEnter={tartiblashniOldindanYukla}
          onClick={() => {
            startTransition(() => setTartiblash(!tartiblashFaol));
          }}
        >
          <ArrowUpDown size={16} />
          Tartiblash
        </Tugma>
        {!sudrashMumkin && (
          <span id={tartiblashIzohId} className="text-sm text-ikkinchi">
            «Qo'shilgan tartibda», qidiruvsiz, 2–200 vazifa bo'lganda
          </span>
        )}
      </p>
      <h2 ref={sarlavha} id={sarlavhaId} tabIndex={-1}>
        Ro'yxat
      </h2>
      {/* Error boundary (18/#08): ro'yxatni chizishda xato bo'lsa — faqat
          ro'yxat o'rnida xabar va «Qayta urinish»; forma, statistika,
          eksport ishlayveradi. Ro'yxat yangilansa (server, boshqa tab) —
          o'zi qayta urinadi (tiklashKaliti). Xato va component stack —
          main.tsx dagi onCaughtError'da */}
      <XatoChegarasi
        tiklashKaliti={vazifalar}
        fallback={(_xato, qaytaUrin) => (
          <div id="royxat-xato" role="alert">
            <p>Ro'yxatni ko'rsatishda xato yuz berdi.</p>
            <button type="button" onClick={qaytaUrin}>
              Qayta urinish
            </button>
          </div>
        )}
      >
        {/* aria-busy + "eskirgan" (CSS: xira) — ekrandagi natija hali
            eski so'rovniki, yangisi fonda chizilmoqda */}
        <ul
          ref={royxatRef}
          id="royxat"
          aria-labelledby={sarlavhaId}
          aria-busy={eskirgan ? true : undefined}
          className={
            [eskirgan && "eskirgan", zichlik === "ixcham" && "ixcham"]
              .filter(Boolean)
              .join(" ") || undefined
          }
        >
          {/* Qator hodisalari — Context (17/#41): VazifaRoyxati va
            VazifaQatori ularni endi tashib o'tmaydi */}
          {/* 20/#17: «Tartiblash» rejimida ro'yxat TartiblashRejimi
              (DndContext, lazy chunk) ichida. Suspense chegarasi doim bor:
              rejimga kirish transition bo'lgani uchun chunk kelguncha eski
              ro'yxat qoladi (fallback ham — o'sha ro'yxat) */}
          <Suspense fallback={royxatTarkibi}>
            {tartiblashFaol ? (
              <TartiblashRejimi
                vazifalar={korinadigan}
                onKochir={tartibniOzgartir}
              >
                {royxatTarkibi}
              </TartiblashRejimi>
            ) : (
              royxatTarkibi
            )}
          </Suspense>
        </ul>
      </XatoChegarasi>
      {/* 20/#12: bo'sh holat — ikonka (bezak) + matn markazda. Tailwind'ning
          "flex" sinfi hidden atributini BOSIB KETADI (utilitalar brauzer
          uslubidan ustun) — shuning uchun faqat [hidden] bo'lmaganda */}
      <p
        id="bosh-xabar"
        hidden={korinadigan.length > 0}
        className="flex-col items-center gap-2 py-6 text-center text-ikkinchi [&:not([hidden])]:flex"
      >
        <ListTodo size={32} />
        {normalla(sorov) === ""
          ? boshMatnlar[filtr]
          : `«${sorov.trim()}» bo'yicha vazifa topilmadi.`}
      </p>
      <Statistika
        qoldi={qoldi}
        bajarildi={bajarildi}
        teglar={teglar}
        yopilgan={yopilgan}
      />
      <StatistikaPaneli vazifalar={vazifalar} />
      <Eksport
        onJson={eksportJson}
        onFayl={eksportFayl}
        onCsv={eksportCsv}
        onJoyTanlab={() => void eksportJoyTanlab()}
      />
      <Import onImport={importQil} />
      <OchirishDialog
        ref={dialogRef}
        matn={ochirilayotgan?.matn ?? null}
        onJavob={ochirishJavobi}
      />
      <TemaTanlov />
      <Izoh />
    </>
  );
}
