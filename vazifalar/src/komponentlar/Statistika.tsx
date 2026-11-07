// Statistika.tsx — hisob va teglar qatori. Hammasi ro'yxatdan
// hisoblanadi (hosilaviy qiymat, 17/#15) — alohida saqlanmaydi
import { useTranslation } from "react-i18next";
import { teglarMatni } from "../teglar.ts";

type Props = {
  qoldi: number;
  bajarildi: number;
  teglar: ReadonlyMap<string, number>; // teg → nechta vazifada
  yopilgan: ReadonlySet<string>; // faqat bajarilganlarda qolgan teglar
};

export function Statistika({
  qoldi,
  bajarildi,
  teglar,
  yopilgan,
}: Props) {
  // 21/#02: ko'plik shakli — i18next tilning qoidasidan (Intl.PluralRules):
  // o'zbekchada "one/other" (shakli bir xil), ruschada "one/few/many"
  const { t } = useTranslation();
  const qoshimcha =
    yopilgan.size > 0 ? `. Yopilgan: ${[...yopilgan].join(", ")}` : "";
  return (
    <>
      <p id="hisob" aria-live="polite">
        {t("hisob.matn", {
          qoldi: t("hisob.qoldi", { count: qoldi }),
          bajarildi: t("hisob.bajarildi", { count: bajarildi }),
        })}
      </p>
      <p id="teglar" hidden={teglar.size === 0}>
        {`Teglar: ${teglarMatni(teglar)}${qoshimcha}`}
      </p>
    </>
  );
}
