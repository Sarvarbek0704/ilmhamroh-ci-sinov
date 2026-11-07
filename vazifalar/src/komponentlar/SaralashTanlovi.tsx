// SaralashTanlovi.tsx — tartib tanlovi (14/#27); tanlov URL'da
import type { Saralash } from "../turlar.ts";

type Props = {
  saralash: Saralash;
  // string: <option> qiymatini DevTools'da o'zgartirish mumkin —
  // tekshiruvni chaqiruvchi qiladi (oq ro'yxat)
  onSaralash: (qiymat: string) => void;
};

export function SaralashTanlovi({ saralash, onSaralash }: Props) {
  return (
    <p id="saralash-qatori">
      <label htmlFor="saralash">Tartib</label>
      {/* value — holatdan: «Orqaga» bosilganda saralash URL'dan keladi,
          tanlov ham ergashadi */}
      <select
        id="saralash"
        value={saralash}
        onChange={(event) => onSaralash(event.target.value)}
      >
        <option value="standart">Qo'shilgan tartibda</option>
        <option value="yangi">Avval yangilari</option>
        <option value="alifbo">Alifbo bo'yicha</option>
      </select>
    </p>
  );
}
