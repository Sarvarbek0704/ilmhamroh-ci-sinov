// eslint.config.js — "flat config": bloklar tartib bilan qo'llanadi
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default defineConfig([
  // Build natijasi (npm run build, npm run analiz) — tekshirmaymiz
  globalIgnores([
    "dist/",
    "dist-profil/",
    "analiz/",
    "coverage/",
    ".vitest/",
    "tekshiruv/msw/ommaviy/",
    "playwright-report/",
    "test-results/",
    "storybook-static/",
  ]),
  // ESLint tavsiya qilgan qoidalar: aniq xatolar (e'lon qilinmagan
  // o'zgaruvchi, ishlatilmagan import, yetib bo'lmaydigan kod...)
  js.configs.recommended,
  {
    // .ts fayllar: typescript-eslint tahlilchisi (parser) va qoidalari.
    // Turlarni tekshirish — tsc ishi (npm run tip), bu yer — kod uslubi
    // va xatoga boshlaydigan joylar (any, ishlatilmagan o'zgaruvchi...)
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommended],
  },
  {
    // Turlarni biladigan qoidalar (typed linting, 16/#38): ESLint
    // tsconfig.json ni o'qiydi (TS 6 API orqali; tsc — TS 7).
    // recommendedTypeChecked ichida 15/#44 dagi uchtasi ham bor
    // (no-floating-promises, no-misused-promises, only-throw-error) va
    // yana: unknown/any bilan xavfli ish (no-unsafe-*), shablon
    // satrdagi obyekt (restrict-template-expressions)...
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.d.ts"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 19/#05: React Router loader/action'da "throw redirect()" va
      // "throw data(…, { status: 404 })" — router shu qiymatlarni ushlaydi
      // (Error emas — javob). Faqat shu ikki tur ruxsat; boshqa narsani
      // throw qilish hamon xato
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: [
            { from: "lib", name: "Response" },
            {
              from: "package",
              package: "react-router",
              name: "DataWithResponseInit",
            },
          ],
        },
      ],
    },
  },
  {
    // React qoidalari (17/#02): hooklar qoidasi (rules-of-hooks — #25),
    // effekt bog'liqliklari (exhaustive-deps — #27) va React Compiler
    // tahlili asosidagi qoidalar (render paytida ref o'qish, state'ni
    // o'zgartirish...). Rasmiy plagin, ESLint 10 bilan mos (peer: ^10)
    files: ["src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    // Xususiyat papkalari (18/#32): tashqaridan faqat ochiq API —
    // xususiyatlar/<nomi>/index.ts. Ichidagi fayl o'zgarsa yoki ko'chsa,
    // tashqi kod buzilmaydi. Xususiyat ichida — nisbiy importlar erkin
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          // 20/#26: LazyMotion ichida faqat m.* — to'liq motion.* butun
          // yadroni birinchi yuklashga qaytaradi. LazyMotion `strict` buni
          // brauzerda USHLAMAYDI (tekshiruvi faqat Node'da ishlaydi —
          // HarakatSozlamasi.tsx), shuning uchun — lint
          paths: [
            {
              name: "motion/react",
              importNames: ["motion"],
              message:
                'LazyMotion: "motion/react-m" dagi m.* ni ishlating.',
            },
          ],
          patterns: [
            {
              regex: "xususiyatlar/[^/]+/(?!index[.]ts$)[^/]+$",
              message:
                "Xususiyatga faqat uning index.ts (ochiq API) orqali.",
            },
          ],
        },
      ],
    },
  },
  {
    // Ilova brauzerda ishlaydi: document, localStorage, fetch...
    files: ["src/**/*.{js,ts,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  {
    // XSS himoyasi (13/#31): matnni HTML yoki kod qilib bajaradigan
    // joylar (sink) taqiqlanadi. Foydalanuvchi matni — faqat textContent
    files: ["src/**/*.{js,ts,tsx}", "public/sw.js"],
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error", // setTimeout("kod")
      "no-new-func": "error",
      "no-script-url": "error", // "javascript:..."
      "no-restricted-properties": [
        "error",
        {
          object: "document",
          property: "write",
          message: "XSS: textContent ishlating.",
        },
        {
          property: "insertAdjacentHTML",
          message: "XSS: insertAdjacentElement yoki append ishlating.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "AssignmentExpression > MemberExpression.left[property.name=/^(innerHTML|outerHTML)$/]",
          message:
            "XSS: innerHTML/outerHTML o'rniga textContent yoki createElement.",
        },
        {
          // React'dagi innerHTML (17/#02): JSX matnni o'zi ekranlaydi,
          // HTML faqat shu atribut orqali kiradi
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "XSS: matnni JSX ichida {matn} qilib yozing.",
        },
      ],
    },
  },
  {
    // Service Worker: self, caches, clients... (window va DOM yo'q)
    files: ["public/sw.js"],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    // Testlar va sozlamalar Node'da ishlaydi: process, console...
    files: ["tekshiruv/**/*.js", "skriptlar/**/*.js", "*.config.js"],
    languageOptions: { globals: globals.node },
  },
]);
