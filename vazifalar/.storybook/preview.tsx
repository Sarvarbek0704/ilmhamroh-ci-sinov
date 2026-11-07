// .storybook/preview.tsx — 22/#11: har story atrofida — ilova CSS i, i18n
// (o'zbekcha), router (Link'lar uchun) va tema. Ilovadagi provayderlar —
// komponent ularsiz chizilmaydi (o'lchandi: OddiyQator — "basename of null")
import type { Preview } from "@storybook/react-vite";
import "../src/vazifalar.css";
import "../src/i18n/index.ts";
import { MemoryRouter } from "react-router";
import { TemaProvider } from "../src/kontekst/TemaKonteksti.tsx";

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <TemaProvider>
          <Story />
        </TemaProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    // 22/#12: addon-a11y — har story axe bilan tekshiriladi; "error" —
    // buzilish bo'lsa Vitest'da test YIQILADI ("todo" — faqat ogohlantirish)
    a11y: { test: "error" },
  },
};
export default preview;
