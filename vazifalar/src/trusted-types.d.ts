// trusted-types.d.ts — Trusted Types API turlari. Brauzerda bor (Chrome
// 83+, CSP: require-trusted-types-for 'script'), lekin TypeScript'ning
// lib.dom'ida yo'q. Kodsiz fayl: faqat tsc uchun "bu global bor" degan
// e'lon. Bizga kerakli qismi — skript manzillari (xavfsiz-manzil.ts)

interface TrustedScriptURL {
  // Brend: oddiy satr bilan almashib ketmasin — faqat siyosatdan
  readonly __trustedScriptURL: unique symbol;
}

interface TrustedTypePolicy {
  createScriptURL(url: string): TrustedScriptURL;
}

interface TrustedTypePolicyFactory {
  createPolicy(
    nomi: string,
    qoidalar: { createScriptURL?: (url: string) => string },
  ): TrustedTypePolicy;
}

// Trusted Types bo'lmagan brauzerda (Firefox) — undefined.
// var — globalThis.trustedTypes bo'lishi uchun (let/const bo'lmaydi)
// eslint-disable-next-line no-var
declare var trustedTypes: TrustedTypePolicyFactory | undefined;

// Declaration merging: lib.dom dagi interfeysga yangi overload
// qo'shiladi — register() siyosatdan o'tgan manzilni ham qabul qiladi
interface ServiceWorkerContainer {
  register(
    manzil: string | URL | TrustedScriptURL,
    sozlama?: RegistrationOptions,
  ): Promise<ServiceWorkerRegistration>;
}
