// KirishFormasi.tsx — 18/#42 da soxta kirish (faqat ism) edi; 28-qism:
// email + parol, vazifalar-api POST /v1/auth/kirish. Forma — <form action>
// + useActionState (async action, 18/#05–#06): xato bo'lsa server matni
// (Problem Details "detail") ko'rinadi, email maydonda qoladi, parol —
// yo'q (qayta yoziladi; parol holatda saqlanmaydi)
import { useActionState, useId, useLayoutEffect, useRef } from "react";
import { Tugma } from "../../ui/Tugma.tsx";
import { useAuth } from "./AuthKonteksti.tsx";

type FormaHolati = {
  readonly xato: string | null;
  readonly email: string;
};

export function KirishFormasi() {
  const { kirish } = useAuth();
  const sarlavhaId = useId();
  const izohId = useId();
  const maydon = useRef<HTMLInputElement>(null);
  const [holat, yuborish, kutilmoqda] = useActionState(
    async (
      _oldingi: FormaHolati,
      malumot: FormData,
    ): Promise<FormaHolati> => {
      const xomEmail = malumot.get("email");
      const xomParol = malumot.get("parol");
      const email = typeof xomEmail === "string" ? xomEmail.trim() : "";
      const parol = typeof xomParol === "string" ? xomParol : "";
      if (email === "" || parol === "") {
        return { xato: "Email va parolni kiriting.", email };
      }
      const xato = await kirish(email, parol);
      return { xato, email: xato === null ? "" : email };
    },
    { xato: null, email: "" },
  );

  // Forma paydo bo'lganda (sahifa ochildi yoki «Chiqish») — fokus email
  // maydoniga (18/#40). Xato bo'lsa ham — maydonga. 19/#07: layout effekt —
  // birinchi (sinxron) chizishdayoq fokus maydonda
  useLayoutEffect(() => {
    maydon.current?.focus();
  }, [holat]);

  return (
    <section id="kirish" aria-labelledby={sarlavhaId}>
      <h2 id={sarlavhaId}>Kirish</h2>
      <p id={izohId} className="izoh">
        Email va parol bilan kiring. Sessiya serverda; brauzerda — faqat
        HttpOnly cookie (JavaScript uni ko'rmaydi).
      </p>
      <form id="kirish-forma" noValidate action={yuborish}>
        <label htmlFor="kirish-email">Email</label>
        <input
          ref={maydon}
          id="kirish-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={holat.email}
          aria-invalid={holat.xato !== null ? true : undefined}
          aria-describedby={
            holat.xato !== null ? `kirish-xato ${izohId}` : izohId
          }
        />
        <label htmlFor="kirish-parol">Parol</label>
        <div className="qator">
          <input
            id="kirish-parol"
            name="parol"
            type="password"
            autoComplete="current-password"
            required
          />
          <Tugma type="submit" variant="asosiy" disabled={kutilmoqda}>
            Kirish
          </Tugma>
        </div>
        <p id="kirish-xato" className="xato" role="status">
          {holat.xato}
        </p>
      </form>
    </section>
  );
}
