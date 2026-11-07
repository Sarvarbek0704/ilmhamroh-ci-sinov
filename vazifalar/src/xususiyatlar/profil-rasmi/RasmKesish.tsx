// RasmKesish.tsx — profil rasmini kvadratga kesish (21/#12, 19/#36 davomi).
// O'z komponentimiz: react-easy-crop 6.2.4 o'lchandi (+7.3 KB gzip) —
// Trusted Types ostida ochilmadi (o'z <style> ini innerHTML bilan qo'shadi;
// natijalar/tajriba/kutubxonalar-21.txt). Bu yerda:
//  - boshqaruv — uchta oddiy slider (kattalashtirish, gorizontal, vertikal):
//    klaviatura va ekran o'quvchi bilan ishlaydi (sudrash — qo'shimcha)
//  - rasm — CSS transform (style prop: CSSOM, CSP style-src 'self' ga mos)
//  - natija — <canvas> da 256×256 WebP: serverga asl fayl emas, kichigi ketadi
import { useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Tugma } from "../../ui/Tugma.tsx";
import { kesishOrni, KESISH_OLCHAMI } from "./kesish.ts";
import type { Kesish } from "./kesish.ts";

type Props = {
  url: string; // tanlangan rasmning obyekt URL'i
  onTayyor: (fayl: File) => void;
  onBekor: () => void;
};

export function RasmKesish({ url, onTayyor, onBekor }: Props) {
  const id = useId();
  const rasm = useRef<HTMLImageElement>(null);
  const [olcham, setOlcham] = useState<{
    eni: number;
    boyi: number;
  } | null>(null);
  const [kesish, setKesish] = useState<Kesish>({ zoom: 1, x: 0, y: 0 });
  const sudrash = useRef<{ x: number; y: number } | null>(null);
  const orin =
    olcham === null
      ? null
      : kesishOrni(olcham.eni, olcham.boyi, kesish);

  function sudra(event: PointerEvent<HTMLDivElement>) {
    const oldingi = sudrash.current;
    if (oldingi === null || orin === null) {
      return;
    }
    // Sichqoncha 1 px → siljish oralig'ining ulushi (oraliq 0 bo'lsa — yo'q)
    const ulush = (masofa: number, oraliq: number) =>
      oraliq === 0 ? 0 : masofa / oraliq;
    setKesish((k) => ({
      ...k,
      x: Math.max(
        -1,
        Math.min(
          1,
          k.x + ulush(event.clientX - oldingi.x, orin.oraliqX),
        ),
      ),
      y: Math.max(
        -1,
        Math.min(
          1,
          k.y + ulush(event.clientY - oldingi.y, orin.oraliqY),
        ),
      ),
    }));
    sudrash.current = { x: event.clientX, y: event.clientY };
  }

  function kes() {
    const element = rasm.current;
    if (element === null || orin === null) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = KESISH_OLCHAMI;
    canvas.height = KESISH_OLCHAMI;
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      return;
    }
    const { manba } = orin;
    ctx.drawImage(
      element,
      manba.x,
      manba.y,
      manba.tomon,
      manba.tomon,
      0,
      0,
      KESISH_OLCHAMI,
      KESISH_OLCHAMI,
    );
    canvas.toBlob(
      (blob) => {
        if (blob !== null) {
          onTayyor(
            new File([blob], "profil.webp", { type: blob.type }),
          );
        }
      },
      "image/webp",
      0.85,
    );
  }

  const slider = (
    nom: keyof Kesish,
    yorliq: string,
    min: number,
    max: number,
  ) => (
    <p>
      <label htmlFor={`${id}-${nom}`}>{yorliq}</label>{" "}
      <input
        id={`${id}-${nom}`}
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={kesish[nom]}
        onChange={(event) =>
          setKesish((k) => ({
            ...k,
            [nom]: Number(event.target.value),
          }))
        }
      />
    </p>
  );

  return (
    <div id="rasm-kesish" role="group" aria-label="Rasmni kesish">
      <div
        className="kesish-maydon"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          sudrash.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={sudra}
        onPointerUp={() => {
          sudrash.current = null;
        }}
      >
        <img
          ref={rasm}
          src={url}
          alt=""
          draggable={false}
          onLoad={(event) =>
            setOlcham({
              eni: event.currentTarget.naturalWidth,
              boyi: event.currentTarget.naturalHeight,
            })
          }
          style={
            orin === null
              ? { visibility: "hidden" }
              : {
                  width: orin.korinishEni,
                  height: orin.korinishBoyi,
                  transform: `translate(${orin.chap}px, ${orin.tepa}px)`,
                }
          }
        />
      </div>
      {slider("zoom", "Kattalashtirish", 1, 3)}
      {slider("x", "Gorizontal", -1, 1)}
      {slider("y", "Vertikal", -1, 1)}
      <p className="qator">
        <Tugma id="kesish-tayyor" variant="asosiy" onClick={kes}>
          Kesish
        </Tugma>
        <Tugma onClick={onBekor}>Bekor qilish</Tugma>
      </p>
    </div>
  );
}
