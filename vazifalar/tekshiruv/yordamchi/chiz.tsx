// yordamchi/chiz.tsx — 22/#06: providerlar bilan render (custom render).
// Ilova komponentlari kontekstga tayanadi: Query keshi, router, tema,
// i18n (vitest-sozlash.ts da bir marta), Zustand store'lari. Ilgari har
// test fayli o'z "Ilova" o'ramini yozardi (5 faylda deyarli bir xil) —
// endi bitta joyda. Har chaqiruv — YANGI QueryClient (testlar bir-
// birining keshini ko'rmasin), store'lar boshlang'ich holatga qaytadi
import { render, renderHook } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { BrowserRouter, MemoryRouter } from "react-router";
import type { ReactElement, ReactNode } from "react";
import { TemaProvider } from "../../src/kontekst/TemaKonteksti.tsx";
import { useIlovaHolati } from "../../src/ilova-holati.ts";
import { useIzohlar } from "../../src/xususiyatlar/izoh/izoh-holati.ts";

type Sozlama = {
  /** "xotira" — MemoryRouter (yol bilan); "brauzer" — haqiqiy
   * location/history (URL'ni tekshiradigan testlar uchun) */
  router?: "xotira" | "brauzer" | undefined;
  /** xotira router'ining boshlang'ich manzili */
  yol?: string | undefined;
  mijoz?: QueryClient | undefined;
};

function yangiMijoz(): QueryClient {
  return new QueryClient({
    // retry: false — xato javob darhol ko'rinsin (sukut: 3 marta qayta)
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/** Zustand store'lari modul darajasida — testlar orasida holat qoladi.
 * getInitialState() — create() dagi boshlang'ich holat (Zustand 5) */
function storelarniTikla(): void {
  useIlovaHolati.setState(useIlovaHolati.getInitialState(), true);
  useIzohlar.setState(useIzohlar.getInitialState(), true);
}

function oramYasa({ router = "xotira", yol = "/", mijoz }: Sozlama) {
  const keshi = mijoz ?? yangiMijoz();
  return function Oram({ children }: { children: ReactNode }) {
    const ichki = <TemaProvider>{children}</TemaProvider>;
    return (
      <QueryClientProvider client={keshi}>
        {router === "brauzer" ? (
          <BrowserRouter>{ichki}</BrowserRouter>
        ) : (
          <MemoryRouter initialEntries={[yol]}>{ichki}</MemoryRouter>
        )}
      </QueryClientProvider>
    );
  };
}

export function chiz(
  ui: ReactElement,
  sozlama: Sozlama & Omit<RenderOptions, "wrapper"> = {},
) {
  const { router, yol, mijoz, ...qolgan } = sozlama;
  storelarniTikla();
  return render(ui, {
    wrapper: oramYasa({ router, yol, mijoz }),
    ...qolgan,
  });
}

export function hookniChiz<N>(hook: () => N, sozlama: Sozlama = {}) {
  storelarniTikla();
  return renderHook(hook, { wrapper: oramYasa(sozlama) });
}
