import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { VazifaRoyxati } from "../src/komponentlar/VazifaRoyxati.tsx";
import { QatorAmallariKonteksti } from "../src/kontekst/qator-amallari.ts";

const meta = {
  component: VazifaRoyxati,
  args: { vazifalar: [], sorov: "", tahrirId: null },
  decorators: [
    (Story) => (
      <QatorAmallariKonteksti
        value={{
          onAlmashtir: fn(),
          onOchir: fn(),
          onTahrirla: fn(),
          onSaqla: fn(() => null),
          onBekor: fn(),
          tugmaRef: () => () => undefined,
        }}
      >
        {/* Komponent faqat <li> lar beradi — <ul> App da (a11y: listitem) */}
        <ul>
          <Story />
        </ul>
      </QatorAmallariKonteksti>
    ),
  ],
} satisfies Meta<typeof VazifaRoyxati>;
export default meta;
type Story = StoryObj<typeof meta>;

export const BoshHolat: Story = {};
export const UchVazifa: Story = {
  args: {
    vazifalar: [
      { id: 1, matn: "Non olish #bozor", bajarildi: false },
      { id: 2, matn: "Sut olish", bajarildi: true },
      { id: 3, matn: "Kitob o'qish #uy", bajarildi: false },
    ],
  },
};
