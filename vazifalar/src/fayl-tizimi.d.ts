// fayl-tizimi.d.ts — File System Access API'ning bitta funksiyasi (21/#17).
// showSaveFilePicker hali standart emas (WICG; Chrome/Edge 86+, Firefox va
// Safari'da yo'q) — TypeScript'ning lib.dom'ida ham yo'q. Faqat bizga
// kerak qismi; FileSystemFileHandle (createWritable) — lib.dom'da bor
declare global {
  type SaqlashTuri = {
    description?: string;
    accept: Record<string, string[]>;
  };

  interface Window {
    showSaveFilePicker?: (sozlama?: {
      suggestedName?: string;
      types?: SaqlashTuri[];
    }) => Promise<FileSystemFileHandle>;
  }
}
export {};
