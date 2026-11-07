// QrKod.tsx — havola QR kodi (21/#16): qrcode.react 4.2.0, SVG React
// elementlari (innerHTML yo'q — Trusted Types bilan ishlaydi). Alohida
// chunk: faqat «Ulashish» ochilganda yuklanadi. O'lchov (kutubxonalar-21):
// qrcode.react +6.0 KB, uqr +3.9 (SVG satr → blob: rasm), qrcode +8.7
import { QRCodeSVG } from "qrcode.react";

export default function QrKod({ havola }: { havola: string }) {
  return (
    <QRCodeSVG
      id="qr-kod"
      value={havola}
      size={160}
      marginSize={2}
      level="M"
      title="Vazifa havolasining QR kodi"
      role="img"
    />
  );
}
