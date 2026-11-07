// sudrash.ts — «Tartiblash» rejimi yoqilganmi (20/#17). Qiymat — tutqichli
// qatorni chizuvchi funksiya (rejimda) yoki null (oddiy rejim). Uni
// TartiblashRejimi (lazy chunk) beradi: OddiyQator dnd-kit'ni import
// qilmaydi — import qilsa, dnd-kit asosiy chunk'ka tushardi
import { createContext } from "react";
import type { ComponentProps, ReactNode } from "react";
import type { SudraladiganQator } from "../komponentlar/SudraladiganQator.tsx";

// Komponent emas, chizuvchi FUNKSIYA: kontekstdan olingan komponentni
// <X /> qilib chizish React Compiler lint'ida xato (static-components —
// "render paytida yaratilgan komponent", o'lchandi)
export type TutqichliQator = (
  props: ComponentProps<typeof SudraladiganQator>,
) => ReactNode;

export const SudrashKonteksti = createContext<TutqichliQator | null>(
  null,
);
