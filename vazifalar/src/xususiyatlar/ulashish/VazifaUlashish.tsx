// VazifaUlashish.tsx — vazifa havolasi: QR kod va nusxalash (21/#16).
// <details> — ochilgandagina QR chunk'i yuklanadi (lazy). Havola — joriy
// til va papka bilan (useHref basename'ni qo'shadi: /vazifalar/ru/vazifa/2).
// Halol cheklov: ro'yxat shu brauzer kaliti bilan serverda — boshqa
// qurilmada havola ochilsa, o'sha qurilmaning o'z ro'yxati (28-qism: kirish)
import { lazy, Suspense, useState } from "react";
import { useHref } from "react-router";
import { Tugma } from "../../ui/Tugma.tsx";

const QrKod = lazy(() => import("./QrKod.tsx"));

export function VazifaUlashish({ id }: { id: number }) {
  const havola = new URL(useHref(`/vazifa/${id}`), location.origin)
    .href;
  const [ochiq, setOchiq] = useState(false);
  const [xabar, setXabar] = useState("");

  async function nusxala() {
    try {
      await navigator.clipboard.writeText(havola);
      setXabar("Havola nusxalandi.");
    } catch {
      // Ruxsat berilmagan yoki xavfsiz kontekst emas — havola ko'rinib turibdi
      setXabar("Nusxalab bo'lmadi — havolani belgilab oling.");
    }
  }

  return (
    <details
      id="ulashish"
      onToggle={(event) => setOchiq(event.currentTarget.open)}
    >
      <summary>Ulashish (QR kod)</summary>
      {ochiq && (
        <Suspense
          fallback={<p role="status">QR kod tayyorlanmoqda…</p>}
        >
          <QrKod havola={havola} />
        </Suspense>
      )}
      <p>
        <a id="ulashish-havola" href={havola}>
          {havola}
        </a>
      </p>
      <p className="qator">
        <Tugma id="havola-nusxala" onClick={() => void nusxala()}>
          Havolani nusxalash
        </Tugma>
      </p>
      <p id="ulashish-xabar" role="status">
        {xabar}
      </p>
      <p className="izoh">
        Ro'yxat shu brauzerda: boshqa qurilmada o'sha qurilmaning
        ro'yxati ochiladi.
      </p>
    </details>
  );
}
