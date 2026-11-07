// useElon.ts — ekran o'quvchi uchun e'lon (#elon, role="status"): matn
// 3 s dan keyin o'chadi (17/#43). 19/#21: holat — Zustand store'da
// (ilova-holati.ts): e'lonni boshqa sahifa va marshrut action'i ham
// qila oladi. Hook'ning tashqi ko'rinishi o'zgarmadi — [matn, elonQil]
import { useIlovaHolati } from "../ilova-holati.ts";

/** @returns [joriy e'lon, e'lon qilish funksiyasi] — useState kabi juftlik */
export function useElon(): [string, (matn: string) => void] {
  // Selektor — faqat shu qism: sozlama o'zgarsa, bu hook chizmaydi
  const elon = useIlovaHolati((h) => h.elon);
  const elonQil = useIlovaHolati((h) => h.elonQil);
  return [elon, elonQil];
}
