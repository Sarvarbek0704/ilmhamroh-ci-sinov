// BelgilanganMatn.tsx — qidiruvga mos bo'laklar <mark> ichida (14/#11).
// v6 da: document.createElement("mark") + textContent. JSX'da {matn} —
// har doim matn: React uni o'zi ekranlaydi, "<b>" HTML bo'lib qolmaydi
import { moslar } from "../qidiruv.ts";

type Props = {
  matn: string;
  sorov: string;
};

export function BelgilanganMatn({ matn, sorov }: Props) {
  const qismlar = [];
  let joy = 0;
  for (const [boshi, oxiri] of moslar(matn, sorov)) {
    qismlar.push(matn.slice(joy, boshi));
    // key: massivdagi element — React ularni tartib bo'yicha tanisin.
    // Bo'lak boshi — shu matn ichida takrorlanmaydi
    qismlar.push(<mark key={boshi}>{matn.slice(boshi, oxiri)}</mark>);
    joy = oxiri;
  }
  qismlar.push(matn.slice(joy));
  // Bo'sh satrlar ekranda ko'rinmaydi — v6 dagidek filtr shart emas
  return <>{qismlar}</>;
}
