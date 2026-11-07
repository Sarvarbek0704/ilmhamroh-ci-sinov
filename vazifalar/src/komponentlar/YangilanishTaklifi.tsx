// YangilanishTaklifi.tsx — "Yangi versiya tayyor. [Yangilash]" (21/#28).
// role="status": ekran o'quvchi bir marta eshitadi, fokus o'g'irlanmaydi
import { useTranslation } from "react-i18next";
import { Tugma } from "../ui/Tugma.tsx";
import { useYangiVersiya, yangila } from "../sw-yangilanish.ts";

export function YangilanishTaklifi() {
  const { t } = useTranslation();
  const bor = useYangiVersiya();
  return (
    <div id="yangilanish" role="status" hidden={!bor}>
      {bor && (
        <p className="qator">
          {t("yangilanish.matn")}{" "}
          <Tugma variant="asosiy" onClick={yangila}>
            {t("yangilanish.tugma")}
          </Tugma>
        </p>
      )}
    </div>
  );
}
