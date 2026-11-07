// vazifa-marshruti.ts — "/vazifa/:id" ning ma'lumot qismi (19/#05, data
// mode). loader — sahifa chizilishidan OLDIN ma'lumotni oladi (router
// kutadi), action — <Form method="post"> yuborilganda ishlaydi. Ikkalasi
// ham React'dan tashqarida: hook yo'q, so'rov — request.signal bilan
// (foydalanuvchi boshqa sahifaga o'tsa, router so'rovni bekor qiladi)
import { data, redirect, replace } from "react-router";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";
import { ApiXatosi } from "../api.ts";
import { boshlangichVazifalar } from "../holat.ts";
import { useIlovaHolati } from "../ilova-holati.ts";
import { foydalanuvchiMatni, saqla, yukla } from "../saqlash.ts";
import {
  api,
  royxatKaliti,
  royxatSorovi,
  sorovMijozi,
  tasdiqniQoy,
  xatoMatni,
} from "../server-sinxron.ts";
import {
  foydalanuvchiniOqi,
  kirishManzili,
} from "../xususiyatlar/auth/index.ts";
import type { VazifaMalumoti } from "../turlar.ts";

type Vazifalar = readonly VazifaMalumoti[];

/** Action natijasi — sahifa useActionData() bilan o'qiydi */
export type VazifaAmalNatijasi = {
  readonly ok: boolean;
  readonly xabar: string;
};

// 19/#14: ro'yxat — Query keshidan (ro'yxat sahifasi bilan BITTA kesh).
// fetchQuery: kesh yangi (30 s) bo'lsa — so'rovsiz, eskirgan bo'lsa —
// serverdan. Server javob bermasa (oflayn, xato) — keshdagi nusxa.
// Bekor qilingan so'rov — qayta tashlanadi (eskirgan navigatsiya)
async function royxatniOl(signal: AbortSignal): Promise<Vazifalar> {
  const kesh = (): Vazifalar =>
    sorovMijozi.getQueryData<Vazifalar>(royxatKaliti) ??
    yukla() ??
    boshlangichVazifalar;
  if (!navigator.onLine) {
    return kesh();
  }
  try {
    return await sorovMijozi.fetchQuery(royxatSorovi());
  } catch (xato) {
    if (
      signal.aborted ||
      (xato instanceof ApiXatosi && xato.kod === "BEKOR")
    ) {
      throw xato;
    }
    console.warn(`Vazifa keshdan: ${xatoMatni(xato)}`);
    return kesh();
  }
}

/** "abc", "1.5" — vazifa yo'q (404); "02" — "2" ga yo'naltiriladi */
function raqaminiOl(id: string | undefined): number {
  const raqam = Number(id);
  if (!Number.isInteger(raqam) || raqam < 1) {
    // data() — xato JAVOB (status bilan): errorElement uni
    // isRouteErrorResponse bilan taniydi
    throw data(`«${id ?? ""}» raqamli vazifa yo'q.`, { status: 404 });
  }
  if (id !== String(raqam)) {
    // Bir vazifa — bitta manzil (19/#04 dagi <Navigate replace> o'rni).
    // replace() — redirect() ning tarixga yozuv QO'SHMAYDIGAN turi
    // (redirect bilan /vazifa/02 ochilganda tarix +1 bo'lardi — o'lchandi)
    throw replace(`/vazifa/${raqam}`);
  }
  return raqam;
}

// 19/#07: loader komponentdan (Himoyalangan) OLDIN ishlaydi — kirmagan
// foydalanuvchi uchun ham serverga so'rov ketardi (o'lchandi). Shuning
// uchun o'zi ham tekshiradi va /kirish ga yo'naltiradi. replace(), redirect()
// emas: redirect yozuv QO'SHADI — «Orqaga» himoyalangan manzilga, loader
// yana /kirish ga — tabdan chiqib bo'lmasdi (o'lchandi)
function kirganmi(request: Request): void {
  if (foydalanuvchiniOqi(foydalanuvchiMatni()) === null) {
    const { pathname, search } = new URL(request.url);
    throw replace(kirishManzili(pathname + search));
  }
}

export async function vazifaLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<VazifaMalumoti> {
  kirganmi(request);
  const raqam = raqaminiOl(params.id);
  const vazifa = (await royxatniOl(request.signal)).find(
    (v) => v.id === raqam,
  );
  if (vazifa === undefined) {
    throw data(`«${raqam}» raqamli vazifa yo'q.`, { status: 404 });
  }
  return vazifa;
}

// Server tasdiqlagan o'zgarish — Query keshiga va boshqa tablarga
// (tasdiqniQoy), brauzer nusxasiga (localStorage); keyin serverdan qayta
function tasdiqlandi(tasdiq: Parameters<typeof tasdiqniQoy>[1]): void {
  tasdiqniQoy(sorovMijozi, tasdiq);
  const yangi = sorovMijozi.getQueryData<Vazifalar>(royxatKaliti);
  if (yangi !== undefined) {
    saqla(yangi);
  }
  void sorovMijozi.invalidateQueries({ queryKey: royxatKaliti });
}

export async function vazifaAction({
  params,
  request,
}: ActionFunctionArgs): Promise<VazifaAmalNatijasi | Response> {
  const raqam = raqaminiOl(params.id);
  const forma = await request.formData();
  const niyat = forma.get("niyat");
  const sozlama = { signal: request.signal };
  try {
    if (niyat === "ochir") {
      const matn = sorovMijozi
        .getQueryData<Vazifalar>(royxatKaliti)
        ?.find((v) => v.id === raqam)?.matn;
      await api.ochir(raqam, sozlama);
      tasdiqlandi({ tur: "ochirildi", id: raqam });
      // 19/#21: e'lon — store'da (React'dan tashqarida, hook'siz):
      // ro'yxat sahifasida ko'rinadi
      useIlovaHolati
        .getState()
        .elonQil(`«${matn ?? raqam}» o'chirildi.`);
      return redirect("/");
    }
    if (niyat === "almashtir") {
      const bajarildi = forma.get("bajarildi") === "true";
      const vazifa = await api.yangila(raqam, { bajarildi }, sozlama);
      tasdiqlandi({ tur: "serverdanKeldi", vazifa });
      return {
        ok: true,
        xabar: bajarildi ? "Bajarildi deb belgilandi." : "Yana faol.",
      };
    }
  } catch (xato) {
    return { ok: false, xabar: `Saqlanmadi: ${xatoMatni(xato)}` };
  }
  throw data("Noma'lum amal", { status: 400 });
}
