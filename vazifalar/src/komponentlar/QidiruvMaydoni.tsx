// QidiruvMaydoni.tsx — qidiruv maydoni va natija soni (14/#11).
// Nomi qidiruv.ts dan farqli: Windows'da fayl nomi katta-kichik harfni
// farqlamaydi — Qidiruv.tsx va qidiruv.ts ESLint'ni chalkashtirdi
// (o'lchandi: "was not found by the project service")

type Props = {
  qidiruv: string;
  // ro'yxatda nechta qator ko'rinadi; null — qidiruv bo'sh (18/#02:
  // son KECHIKTIRILGAN so'rovniki — ekrandagi ro'yxat bilan bir xil)
  topildi: number | null;
  onQidir: (matn: string) => void;
};

export function QidiruvMaydoni({ qidiruv, topildi, onQidir }: Props) {
  return (
    <search>
      <label htmlFor="qidiruv">Qidiruv</label>
      {/* value — holatdan (controlled, #18 da batafsil): vazifa
          qo'shilganda yoki import'da holat qidiruvni tozalasa, maydon
          ham bo'shaydi. type="search": Esc va × ham — onChange keladi */}
      <input
        type="search"
        id="qidiruv"
        maxLength={100}
        autoComplete="off"
        value={qidiruv}
        onChange={(event) => onQidir(event.target.value)}
      />
      {/* Ekran o'quvchi yozayotganda natija sonini eshitadi */}
      <p id="qidiruv-natija" role="status">
        {topildi === null ? "" : `${topildi} ta topildi`}
      </p>
    </search>
  );
}
