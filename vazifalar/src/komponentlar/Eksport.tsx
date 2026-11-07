// Eksport.tsx — ro'yxat JSON matni va fayl (13/#11). Matn maydoni faqat
// o'qish uchun: qiymati state'dan (controlled + readOnly)
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Tugma } from "../ui/Tugma.tsx";
import { joyTanlashBor } from "../fayl.ts";

type Props = {
  onJson: () => string; // eksport matni (e'lonni ham chaqiruvchi qiladi)
  onFayl: () => void;
  onCsv: () => void; // 21/#15: Excel uchun
  onJoyTanlab?: () => void; // 21/#17: showSaveFilePicker bor brauzerda
};

export function Eksport({ onJson, onFayl, onCsv, onJoyTanlab }: Props) {
  const [json, setJson] = useState("");
  const maydon = useRef<HTMLTextAreaElement>(null);

  function jsonniKorsat() {
    // flushSync: matn DOM'ga HOZIR tushsin — keyingi qatorda uni
    // belgilaymiz (select). Odatda setState hodisadan keyin chiziladi
    flushSync(() => setJson(onJson()));
    maydon.current?.focus();
    maydon.current?.select();
  }

  return (
    <>
      <h2>Eksport</h2>
      <Tugma id="eksport-tugma" onClick={jsonniKorsat}>
        JSON qilib chiqarish
      </Tugma>
      <Tugma id="eksport-fayl" onClick={onFayl}>
        Faylga yuklab olish
      </Tugma>
      <Tugma id="eksport-csv" onClick={onCsv}>
        CSV (Excel uchun)
      </Tugma>
      {/* 21/#17: progressiv — API yo'q brauzerda tugma umuman yo'q */}
      {onJoyTanlab !== undefined && joyTanlashBor() && (
        <Tugma id="eksport-joy" onClick={onJoyTanlab}>
          Joyini tanlab saqlash…
        </Tugma>
      )}
      <label htmlFor="eksport-matn">Vazifalar JSON ko'rinishida</label>
      <textarea
        ref={maydon}
        id="eksport-matn"
        rows={6}
        readOnly
        value={json}
      />
    </>
  );
}
