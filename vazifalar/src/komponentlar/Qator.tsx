// Qator.tsx — ro'yxat qatorining "qobig'i" (17/#07: children). Oddiy
// qator ham, tahrir qatori ham <li> ichida turadi; ichiga nima qo'yilishi
// — chaqiruvchining ishi (kompozitsiya)
import type { ReactNode } from "react";
import * as m from "motion/react-m";
import { useQatorHarakati } from "../ui/qator-harakati.ts";
import type { QatorJoyi } from "../turlar.ts";

type Props = {
  id: number;
  bajarildi?: boolean;
  // 18/#23: virtual ro'yxatda — balandligi o'lchanadi (olchov), ekran
  // o'quvchiga haqiqiy o'rni va jami soni aytiladi (DOM'da hammasi yo'q)
  joy?: QatorJoyi | undefined;
  children: ReactNode;
  yangi?: boolean; // 20/#25: kirish animatsiyasi
};

export function Qator({
  id,
  bajarildi = false,
  joy,
  children,
  yangi = false,
}: Props) {
  const harakat = useQatorHarakati(yangi);
  // 20/#25: to'liq ro'yxatda — m.li (yangi qator paydo bo'lishi);
  // virtual ro'yxatda — oddiy li (aylantirishda chizilganlar animatsiyasiz)
  if (joy === undefined) {
    return (
      <m.li
        data-id={id}
        className={bajarildi ? "bajarildi" : undefined}
        {...harakat}
      >
        {children}
      </m.li>
    );
  }
  return (
    // data-id — e2e ssenariy va fondaYangila (fokus) shunga qaraydi
    <li
      ref={joy?.olchov(id)}
      data-id={id}
      aria-posinset={joy === undefined ? undefined : joy.indeks + 1}
      aria-setsize={joy?.jami}
      className={bajarildi ? "bajarildi" : undefined}
    >
      {children}
    </li>
  );
}
