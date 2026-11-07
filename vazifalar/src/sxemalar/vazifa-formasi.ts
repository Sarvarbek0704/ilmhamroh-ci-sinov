// vazifa-formasi.ts — formalar sxemasi (19/#30–#31): React Hook Form shu
// sxemani resolver orqali ishlatadi. Qoidalar — ro'yxat formasidagi
// (holat.ts xatoniTop) bilan bir xil matnlar: bo'sh, juda uzun, takror.
// zod/mini (19/#12 qarori — hajm): zanjir o'rniga .check(...)
import { z } from "zod/mini";
import { Vazifa } from "../vazifa.ts";

/** Matn: chetlari kesiladi (transform), keyin tekshiriladi */
export function matnSxemasi(takrormi: (matn: string) => boolean) {
  return z.string().check(
    // z.trim() — qiymatni O'ZGARTIRADI (overwrite): forma natijasida
    // kesilgan matn; keyingi tekshiruvlar kesilganiga qaraydi
    z.trim(),
    z.minLength(1, "Vazifa matnini yozing."),
    z.maxLength(
      Vazifa.MAKS_UZUNLIK,
      `Matn juda uzun (ko'pi bilan ${Vazifa.MAKS_UZUNLIK} belgi).`,
    ),
    z.refine(
      (matn) => !takrormi(matn),
      "Bu vazifa ro'yxatda allaqachon bor.",
    ),
  );
}

/**
 * Tahrirlash formasi (19/#31–#32). takrormi — shu vazifadan BOSHQA
 * vazifada shu matn bormi (sxema ro'yxatni bilmaydi — tashqaridan)
 */
export function tahrirSxemasi(takrormi: (matn: string) => boolean) {
  return z.object({
    matn: matnSxemasi(takrormi),
    bajarildi: z.boolean(),
  });
}

export type TahrirQiymati = z.output<ReturnType<typeof tahrirSxemasi>>;
