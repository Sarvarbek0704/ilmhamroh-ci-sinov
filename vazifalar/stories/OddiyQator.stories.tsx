import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { OddiyQator } from "../src/komponentlar/OddiyQator.tsx";
import { QatorAmallariKonteksti } from "../src/kontekst/qator-amallari.ts";

const amallar = {
  onAlmashtir: fn(),
  onOchir: fn(),
  onTahrirla: fn(),
  onSaqla: fn(() => null),
  onBekor: fn(),
  tugmaRef: () => () => undefined,
};

const meta = {
  component: OddiyQator,
  args: {
    vazifa: { id: 1, matn: "Non olish #bozor", bajarildi: false },
    sorov: "",
  },
  decorators: [
    (Story) => (
      <QatorAmallariKonteksti value={amallar}>
        <ul>
          <Story />
        </ul>
      </QatorAmallariKonteksti>
    ),
  ],
} satisfies Meta<typeof OddiyQator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Faol: Story = {};
export const Bajarilgan: Story = {
  args: { vazifa: { id: 2, matn: "Sut olish", bajarildi: true } },
};
export const QidiruvBilan: Story = { args: { sorov: "non" } };
export const Belgilash: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Non olish #bozor" }),
    );
    await expect(amallar.onAlmashtir).toHaveBeenCalledWith(1);
  },
};
