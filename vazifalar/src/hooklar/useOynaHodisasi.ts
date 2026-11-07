// useOynaHodisasi.ts — window hodisasiga obuna (17/#44: "useEventListener"
// retsepti). App'da popstate, pagehide, online, offline uchun bir xil
// addEventListener + cleanup to'rt marta yozilgan edi
import { useEffect, useEffectEvent } from "react";

export function useOynaHodisasi<T extends keyof WindowEventMap>(
  tur: T,
  ishlovchi: (event: WindowEventMap[T]) => void,
): void {
  // Effekt hodisasi (#31): ishlovchi har renderda yangi funksiya bo'lsa
  // ham, obuna qayta ulanmaydi — chaqirilganda eng so'nggisi ishlaydi
  const chaqir = useEffectEvent(ishlovchi);
  useEffect(() => {
    const tinglovchi = (event: WindowEventMap[T]) => chaqir(event);
    addEventListener(tur, tinglovchi);
    return () => removeEventListener(tur, tinglovchi);
  }, [tur]);
}
