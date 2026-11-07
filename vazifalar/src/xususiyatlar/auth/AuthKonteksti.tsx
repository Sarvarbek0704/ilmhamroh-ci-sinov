// AuthKonteksti.tsx — kim kirgan. 18/#42 da SOXTA edi (faqat ism); 28-qism:
// HAQIQIY server sessiyasi (vazifalar-api /v1/auth). Kimlik — HttpOnly
// cookie'da (__Host-sessiya): JS uni ko'rmaydi va o'g'irlay olmaydi (XSS).
// localStorage'da endi faqat KO'RSATISH uchun ism (UI va loader tez
// bilsin) — u ishonch manbai EMAS: ochilganda /auth/men bilan
// tekshiriladi, server 401 bersa o'chiriladi. Haqiqiy himoya — serverda
// (har so'rovda sessiya). Obuna — avvalgidek: shu tab va BOSHQA tablar
// (BroadcastChannel, sinxron.ts); kanalga shaxsiy ma'lumot chiqmaydi
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import {
  foydalanuvchiMatni,
  foydalanuvchiNusxasiniTozala,
  foydalanuvchiniSaqla,
} from "../../saqlash.ts";
import { sorovMijozi } from "../../server-sinxron.ts";
import { AUTH, tarqat, tingla } from "../../sinxron.ts";
import type { Foydalanuvchi } from "../../turlar.ts";
import { authSorov, serverIsmi } from "./server.ts";
import { foydalanuvchiniOqi } from "./foydalanuvchi.ts";

type AuthQiymati = {
  foydalanuvchi: Foydalanuvchi | null;
  /** @returns xato matni (server "detail") yoki null — kirildi */
  kirish: (email: string, parol: string) => Promise<string | null>;
  /** @returns xato matni yoki null — chiqildi */
  chiqish: () => Promise<string | null>;
  // Shu tabda HOZIR kirildi: fokus foydalanuvchi menyusiga (18/#40 —
  // forma yo'qoladi, fokus <body> ga tushib qolmasin). Sahifa
  // ochilganda (sessiya bor) — false: fokusni o'g'irlamaymiz
  hozirKirdi: boolean;
};

const AuthKonteksti = createContext<AuthQiymati | null>(null);

// Shu tabdagi obunachilar (uSES tinglovchilari)
const obunachilar = new Set<() => void>();
function xabarBer() {
  for (const tinglovchi of obunachilar) {
    tinglovchi();
  }
}

function obuna(tinglovchi: () => void): () => void {
  obunachilar.add(tinglovchi);
  const tabdan = tingla((xabar) => {
    if (xabar.tur === AUTH) {
      tinglovchi();
    }
  });
  return () => {
    obunachilar.delete(tinglovchi);
    tabdan();
  };
}

function ozgardi() {
  tarqat({ tur: AUTH }); // boshqa tablar
  xabarBer(); // shu tab (BroadcastChannel o'z tabiga yubormaydi)
}

/** Server aytgan kimlikni brauzer nusxasiga yozadi (o'zgargan bo'lsa) */
function kimlikniYoz(f: Foydalanuvchi | null): void {
  const eski = foydalanuvchiniOqi(foydalanuvchiMatni());
  if (eski?.ism === f?.ism) {
    return;
  }
  if (f === null) {
    foydalanuvchiNusxasiniTozala(); // sessiya tugagan: nusxa ham ketadi
  }
  foydalanuvchiniSaqla(f);
  ozgardi();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Snapshot — xom matn (satr — barqaror qiymat; har chaqiriqda yangi
  // obyekt bersak, React cheksiz qayta chizardi), o'qish — useMemo'da
  const matn = useSyncExternalStore(
    obuna,
    foydalanuvchiMatni,
    () => null,
  );
  const foydalanuvchi = useMemo(() => foydalanuvchiniOqi(matn), [matn]);
  const [hozirKirdi, setHozirKirdi] = useState(false);

  // Hech kim kirmagan (shu yoki BOSHQA tabda chiqildi, sessiya tugadi) —
  // Query keshi (xotiradagi server javoblari) ham bo'shaydi: keyingi
  // kirgan odam oldingisining ro'yxatini ko'rmasin
  useEffect(() => {
    if (foydalanuvchi === null) {
      sorovMijozi.clear();
    }
  }, [foydalanuvchi]);

  // Ochilganda — server nima deydi: sessiya tugagan/bekor qilingan
  // (boshqa qurilmada «hamma joydan chiqish») bo'lsa, nusxa o'chadi.
  // Tarmoq xatosi — nusxaga tegmaymiz (oflayn ochilish, 19/#10)
  useEffect(() => {
    const bekor = new AbortController();
    authSorov("men", { signal: bekor.signal }).then(
      async (javob) => {
        if (javob.status === 401) {
          kimlikniYoz(null);
        } else if (javob.ok) {
          kimlikniYoz(serverIsmi(await javob.json()));
        }
      },
      () => {},
    );
    return () => {
      bekor.abort();
    };
  }, []);

  const qiymat: AuthQiymati = {
    foydalanuvchi,
    hozirKirdi: hozirKirdi && foydalanuvchi !== null,
    async kirish(email, parol) {
      const javob = await authSorov("kirish", {
        method: "POST",
        body: { email, parol, eslabQol: true },
      });
      const malumot: unknown = await javob.json().catch(() => null);
      if (!javob.ok) {
        return xatoMatni(malumot);
      }
      const f = serverIsmi(malumot);
      if (f === null) {
        // { mfa: "kerak" } — ikkinchi qadam (28/#18) bu formada hali yo'q
        return "Hisobda ikki bosqichli tasdiqlash yoqilgan — bu forma uni hali qo'llamaydi.";
      }
      // Oldingi (tugagan) sessiyadan qolgan nusxa — boshqa odamniki bo'lishi
      // mumkin: ro'yxat serverdan qayta olinadi
      foydalanuvchiNusxasiniTozala();
      foydalanuvchiniSaqla(f);
      setHozirKirdi(true);
      ozgardi();
      return null;
    },
    async chiqish() {
      // Server sessiyani o'chiradi va cookie'ni tozalaydi. Server rad etsa
      // yoki javob kelmasa — UI'da ham CHIQMAYMIZ: sessiya serverda tirik,
      // cookie brauzerda; "chiqdim" deb ko'rsatish yolg'on bo'lardi
      // (o'lchandi: 403 da UI chiqqan, keyingi GET /v1/vazifalar — 200)
      const javob = await authSorov("chiqish", {
        method: "POST",
      }).catch(() => null);
      if (javob === null) {
        return "Serverga ulanib bo'lmadi — chiqilmadi. Qayta urinib ko'ring.";
      }
      // 401 — sessiya allaqachon yo'q: chiqish maqsadiga yetilgan
      if (!javob.ok && javob.status !== 401) {
        return xatoMatni(await javob.json().catch(() => null));
      }
      foydalanuvchiNusxasiniTozala();
      foydalanuvchiniSaqla(null);
      setHozirKirdi(false);
      ozgardi();
      return null;
    },
  };
  return <AuthKonteksti value={qiymat}>{children}</AuthKonteksti>;
}

function xatoMatni(malumot: unknown): string {
  if (
    typeof malumot === "object" &&
    malumot !== null &&
    "detail" in malumot &&
    typeof malumot.detail === "string"
  ) {
    return malumot.detail;
  }
  return "Server so'rovni bajarmadi. Birozdan keyin qayta urinib ko'ring.";
}

/** Auth konteksti. Provider ichida bo'lmasa — aniq xato */
export function useAuth(): AuthQiymati {
  const qiymat = use(AuthKonteksti);
  if (qiymat === null) {
    throw new Error("useAuth() — <AuthProvider> ichida chaqirilsin");
  }
  return qiymat;
}
