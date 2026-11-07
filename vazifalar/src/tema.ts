// tema.ts — sahifa chizilishidan OLDIN ishlaydi: saqlangan tanlovni
// qo'llaydi (aks holda sahifa bir lahza tizim rangida "chaqnaydi").
// Oddiy skript (modul emas): modul kechiktiriladi, bu esa kutmasligi
// kerak. Shu sabab saqlash.ts ni import qila olmaydi — kalit nomi
// saqlash.ts dagi TEMA_KALITI bilan bir xil bo'lishi shart.
// import/export yo'q — Vite uni alohida kirish nuqtasi qilib
// assets/js/tema.js ga yozadi (vite.config.ts), import'siz bitta fayl
try {
  const tema = localStorage.getItem("vazifalar:tema");
  if (tema === "yorug" || tema === "qorongi") {
    document.documentElement.dataset.tema = tema;
  }
} catch {
  // localStorage yopiq — tizim rejimi qoladi
}
