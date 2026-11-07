// marshrutlar.tsx — sahifalar xaritasi (19/#02). React Router 8, "data
// mode": marshrutlar — obyektlar (path → element), router ularni
// createBrowserRouter bilan oladi (main.tsx). Layout marshrut (Qobiq) —
// umumiy qism, bolalari uning <Outlet /> o'rnida. errorElement — shu
// marshrut yoki bolalari xato tashlasa
import type { RouteObject } from "react-router";
import type { NonYoliHandle } from "./sahifalar/NonYoli.tsx";
import type { VazifaMalumoti } from "./turlar.ts";
import {
  Himoyalangan,
  KirishSahifasi,
} from "./xususiyatlar/auth/index.ts";
import { Qobiq } from "./sahifalar/Qobiq.tsx";
import { RoyxatSahifasi } from "./sahifalar/RoyxatSahifasi.tsx";
import { TopilmadiSahifasi } from "./sahifalar/TopilmadiSahifasi.tsx";
import { VazifaSahifasi } from "./sahifalar/VazifaSahifasi.tsx";
import { VazifaXatosi } from "./sahifalar/VazifaXatosi.tsx";
import {
  vazifaAction,
  vazifaLoader,
} from "./sahifalar/vazifa-marshruti.ts";
import { XatoSahifasi } from "./sahifalar/XatoSahifasi.tsx";

// 21/#31: ro'yxatdan boshqa sahifalar — kech yuklanadi (router lazy):
// birinchi yuklashda faqat ro'yxat sahifasi (u birinchi kadrda chiziladi —
// CLS 0). Sahifa kodi menyudagi havolaga o'tilganda keladi (keyin keshda)
const sahifa =
  <T,>(yuklovchi: () => Promise<T>, nom: keyof T) =>
  () =>
    yuklovchi().then((m) => ({
      Component: m[nom] as React.ComponentType,
    }));

// Non yo'li bo'laklari (19/#10): Qobiq ularni useMatches() bilan yig'adi
const nomi = (matn: string): NonYoliHandle => ({ nonYoli: () => matn });
const vazifaNomi: NonYoliHandle = {
  // loader ma'lumoti — vazifa (xato bo'lsa undefined)
  nonYoli: (malumot) =>
    (malumot as VazifaMalumoti | undefined)?.matn ?? "Vazifa",
};

export const marshrutlar: RouteObject[] = [
  {
    path: "/",
    element: <Qobiq />,
    errorElement: <XatoSahifasi />,
    // 19/#05: sahifa birinchi ochilishida loader ishlayotgan bo'lsa
    // (/vazifa/2 to'g'ridan) — router shuni ko'rsatadi. Ro'yxat sahifasida
    // loader yo'q: u birinchi kadrda chiziladi (CLS 0, 13/#30)
    hydrateFallbackElement: <p role="status">Yuklanmoqda…</p>,
    children: [
      // 19/#07: ochiq sahifa — kirish
      { path: "kirish", element: <KirishSahifasi /> },
      {
        // Yo'lsiz (pathless) layout marshrut: manzilga hech narsa
        // qo'shmaydi, faqat bolalarini o'raydi — kirmagan bo'lsa /kirish
        element: <Himoyalangan />,
        handle: nomi("Ro'yxat"),
        children: [
          // index — ota manzilining o'zi ("/")
          { index: true, element: <RoyxatSahifasi /> },
          {
            path: "statistika",
            lazy: sahifa(
              () => import("./sahifalar/StatistikaSahifasi.tsx"),
              "StatistikaSahifasi",
            ),
            handle: nomi("Statistika"),
          },
          // 19/#33: ko'p qadamli forma (wizard)
          {
            path: "yangi",
            lazy: sahifa(
              () => import("./sahifalar/YangiLoyiha.tsx"),
              "YangiLoyiha",
            ),
            handle: nomi("Qadamlarga bo'lib"),
          },
          // 21/#26: AI yordamchi — kech yuklanadi (router lazy): sahifa kodi
          // faqat shu manzil ochilganda
          {
            path: "yordamchi",
            lazy: () =>
              import("./xususiyatlar/yordamchi/index.ts").then((m) => ({
                Component: m.YordamchiSahifasi,
              })),
            handle: nomi("Yordamchi"),
          },
          {
            path: "sozlamalar",
            lazy: sahifa(
              () => import("./sahifalar/SozlamalarSahifasi.tsx"),
              "SozlamalarSahifasi",
            ),
            handle: nomi("Sozlamalar"),
          },
          // 19/#03: dinamik segment — ":id" har qanday qiymat
          // (/vazifa/2, /vazifa/abc); ichida — o'z bolalari (ichma-ich)
          // 19/#05: loader — vazifa serverdan (yoki keshdan), xato —
          // errorElement (Qobiq ichida). action — formasi bor bo'limda:
          // action'siz <Form> o'zi turgan marshrutga yuboradi (index ham)
          {
            path: "vazifa/:id",
            element: <VazifaSahifasi />,
            loader: vazifaLoader,
            errorElement: <VazifaXatosi />,
            handle: vazifaNomi,
            children: [
              {
                index: true,
                lazy: sahifa(
                  () => import("./sahifalar/VazifaUmumiy.tsx"),
                  "VazifaUmumiy",
                ),
                action: vazifaAction,
              },
              // 19/#29–#32: tahrir formasi (React Hook Form + Zod)
              {
                path: "tahrir",
                lazy: sahifa(
                  () => import("./sahifalar/VazifaTahriri.tsx"),
                  "VazifaTahriri",
                ),
                handle: nomi("Tahrirlash"),
              },
            ],
          },
        ],
      },
      // "*" — boshqa hech biriga mos kelmagan manzil
      { path: "*", element: <TopilmadiSahifasi /> },
    ],
  },
];
