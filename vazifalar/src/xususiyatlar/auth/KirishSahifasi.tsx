// KirishSahifasi.tsx — "/kirish" (19/#07). Kirgan bo'lsa (shu tabda
// forma orqali yoki BOSHQA tabda) — ?keyin= dagi sahifaga, qaytish
// tarixda qolmasin (replace)
import { Navigate, useSearchParams } from "react-router";
import { useAuth } from "./AuthKonteksti.tsx";
import { keyingiManzil } from "./foydalanuvchi.ts";
import { KirishFormasi } from "./KirishFormasi.tsx";

export function KirishSahifasi() {
  const { foydalanuvchi } = useAuth();
  const [parametrlar] = useSearchParams();
  if (foydalanuvchi !== null) {
    return (
      <Navigate to={keyingiManzil(parametrlar.get("keyin"))} replace />
    );
  }
  return (
    <>
      <title>Kirish — Vazifalar</title>
      <KirishFormasi />
    </>
  );
}
