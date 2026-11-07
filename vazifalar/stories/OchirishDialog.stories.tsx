import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";
import { OchirishDialog } from "../src/komponentlar/OchirishDialog.tsx";

// Dialog ref orqali ochiladi (showModal) — story o'zi ochib qo'yadi
function Ochiq(props: { matn: string; onJavob: (t: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);
  return <OchirishDialog ref={ref} {...props} />;
}

const meta = {
  component: Ochiq,
  args: { matn: "Non olish #bozor", onJavob: fn() },
} satisfies Meta<typeof Ochiq>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OchiqDialog: Story = {};
export const Tasdiq: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "O'chirish" }),
    );
    // close hodisasi — keyingi task'da (form method="dialog")
    await waitFor(() =>
      expect(args.onJavob).toHaveBeenCalledWith(true),
    );
  },
};
