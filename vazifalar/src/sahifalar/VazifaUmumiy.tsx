// VazifaUmumiy.tsx — "/vazifa/:id" ning index bo'limi (19/#03): holati,
// teglari. 19/#05: o'zgartirish — <Form method="post"> → marshrut
// action'i (vazifa-marshruti.ts); tugagach router loader'ni QAYTA
// chaqiradi (revalidation) — sahifa serverdagi yangi holatni ko'rsatadi
import { useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { teglariniOl } from "../royxat.ts";
import { Tugma } from "../ui/Tugma.tsx";
import { VazifaIzohi } from "../xususiyatlar/izoh/index.ts";
import { VazifaUlashish } from "../xususiyatlar/ulashish/index.ts";
import { useVazifa } from "./vazifa-konteksti.ts";
import type { vazifaAction } from "./vazifa-marshruti.ts";

export function VazifaUmumiy() {
  const { vazifa } = useVazifa();
  const teglar = [...teglariniOl(vazifa.matn)];
  // Action natijasi (oxirgi yuborishniki): xabar yoki xato
  const natija = useActionData<typeof vazifaAction>();
  // Yuborilmoqda: tugma matni — router holatidan (useState shart emas)
  const yuborilmoqda = useNavigation().state === "submitting";
  const [soralmoqda, setSoralmoqda] = useState(false);
  return (
    <>
      <dl className="vazifa-malumoti">
        <dt>Holati</dt>
        <dd id="vazifa-holati">
          {vazifa.bajarildi ? "Bajarilgan" : "Faol"}
        </dd>
        <dt>Teglar</dt>
        <dd id="vazifa-teglari">
          {teglar.length === 0 ? "yo'q" : teglar.join(", ")}
        </dd>
        <dt>Raqami</dt>
        <dd>{vazifa.id}</dd>
      </dl>
      {/* Oddiy HTML forma kabi: name/value — FormData'da. Sahifa qayta
          yuklanmaydi — router submit'ni ushlab action'ga beradi */}
      <Form method="post" className="qator">
        <input type="hidden" name="niyat" value="almashtir" />
        <input
          type="hidden"
          name="bajarildi"
          value={String(!vazifa.bajarildi)}
        />
        <Tugma type="submit" id="vazifa-almashtir" variant="asosiy">
          {yuborilmoqda
            ? "Saqlanmoqda…"
            : vazifa.bajarildi
              ? "Yana faol qilish"
              : "Bajarildi deb belgilash"}
        </Tugma>
      </Form>
      {soralmoqda ? (
        <Form method="post" className="qator">
          <input type="hidden" name="niyat" value="ochir" />
          <Tugma type="submit" id="vazifa-ochir" variant="xavfli">
            Ha, o'chirish
          </Tugma>
          <Tugma onClick={() => setSoralmoqda(false)}>
            Bekor qilish
          </Tugma>
        </Form>
      ) : (
        <Tugma id="vazifa-ochirish" onClick={() => setSoralmoqda(true)}>
          O'chirish…
        </Tugma>
      )}
      <p id="vazifa-xabar" role="status">
        {natija?.xabar}
      </p>
      {/* 21/#08: izoh (Markdown) — shu brauzerda */}
      <VazifaIzohi id={vazifa.id} />
      {/* 21/#16: havola — QR kod (kech chunk) va nusxalash */}
      <VazifaUlashish id={vazifa.id} />
    </>
  );
}
