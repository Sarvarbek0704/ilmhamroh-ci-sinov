import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Tugma } from "../src/ui/Tugma.tsx";

const meta = {
  component: Tugma,
  args: { children: "Saqlash", onClick: fn() },
} satisfies Meta<typeof Tugma>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Oddiy: Story = {};
export const Asosiy: Story = { args: { variant: "asosiy" } };
export const Xavfli: Story = {
  args: { variant: "xavfli", children: "O'chirish" },
};
export const Bosiladi: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Saqlash" }),
    );
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
