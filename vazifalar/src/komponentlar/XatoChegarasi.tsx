// XatoChegarasi.tsx — error boundary (18/#08). Render paytidagi xato
// (komponent throw qildi) butun ilovani oq ekranga aylantirmaydi
// (17/#45 da shunday edi: #ilova ichida 0 element): faqat shu chegara
// ichi fallback'ga almashadi, qolgan ilova ishlayveradi.
// Hozircha faqat CLASS komponent bo'la oladi: hooklarda
// getDerivedStateFromError/componentDidCatch o'xshashi yo'q (R-59 —
// class komponentni o'qish shu yerda kerak bo'ladi).
// Ushlamaydi: hodisa ishlovchisidagi xato (onClick), async kod
// (setTimeout, await), chegaraning o'zidagi xato — ular uchun try/catch
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

type Props = {
  children: ReactNode;
  // Xato bo'lganda nima ko'rinadi; qaytaUrin — chegarani tiklaydi
  fallback: (xato: unknown, qaytaUrin: () => void) => ReactNode;
  // Bu qiymat o'zgarsa — chegara o'zi tiklanadi (masalan, ro'yxat
  // serverdan yangilandi — ehtimol xato ma'lumot ham tuzaldi)
  tiklashKaliti?: unknown;
  onXato?: (xato: unknown, malumot: ErrorInfo) => void;
};

type Holat = { readonly xato: { readonly qiymat: unknown } | null };

export class XatoChegarasi extends Component<Props, Holat> {
  override state: Holat = { xato: null };

  // Render bosqichi: xatodan keyingi holat (sof — faqat state qaytaradi).
  // { qiymat } o'rami: throw null/undefined bo'lsa ham "xato bor" bilinsin
  static getDerivedStateFromError(xato: unknown): Holat {
    return { xato: { qiymat: xato } };
  }

  // Commit bosqichi: yon ta'sir (log) — componentStack bilan
  override componentDidCatch(xato: unknown, malumot: ErrorInfo): void {
    this.props.onXato?.(xato, malumot);
  }

  override componentDidUpdate(oldingi: Props): void {
    if (
      this.state.xato !== null &&
      !Object.is(oldingi.tiklashKaliti, this.props.tiklashKaliti)
    ) {
      this.qaytaUrin();
    }
  }

  // Arrow — this doim shu nusxa (fallback'dagi tugmaga uzatiladi)
  qaytaUrin = (): void => {
    this.setState({ xato: null });
  };

  override render(): ReactNode {
    if (this.state.xato !== null) {
      return this.props.fallback(
        this.state.xato.qiymat,
        this.qaytaUrin,
      );
    }
    return this.props.children;
  }
}
