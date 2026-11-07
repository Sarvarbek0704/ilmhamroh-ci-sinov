// FoydalanuvchiMenyusi.tsx — kim kirgan va «Chiqish» (18/#42). 20/#03:
// shadcn/ui DropdownMenu (Radix) — statistika hisobotidagi menyu bilan bir xil
import { useLayoutEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu.tsx";
import { Tugma } from "../../ui/Tugma.tsx";
import { ChevronDown, LogOut } from "lucide-react";
import { useProfilRasmi } from "../profil-rasmi/index.ts";
import { useAuth } from "./AuthKonteksti.tsx";

export function FoydalanuvchiMenyusi() {
  const { foydalanuvchi, chiqish, hozirKirdi } = useAuth();
  const qobiq = useRef<HTMLDivElement>(null);
  // 19/#36: profil rasmi (bo'lsa) — ism yonida, bezak (alt="")
  const rasm = useProfilRasmi();
  // 28-qism: server chiqishni rad etsa — sabab ko'rinadi (UI "chiqdi" demaydi)
  const [xato, setXato] = useState<string | null>(null);

  // Hozirgina kirildi: kirish formasi yo'qoldi — fokus shu tugmaga
  // (ekran o'quvchi ismni eshitadi, keyingi Tab — ilovaga). Sahifa
  // sessiya bilan ochilganda — tegmaymiz (fokus o'g'irlanmasin)
  useLayoutEffect(() => {
    if (hozirKirdi) {
      qobiq.current?.querySelector("button")?.focus();
    }
  }, [hozirKirdi]);

  if (foydalanuvchi === null) {
    return null;
  }
  return (
    <div ref={qobiq} id="foydalanuvchi">
      <DropdownMenu>
        {/* 20/#04: asChild — trigger bizning Tugma (statistika menyusi kabi) */}
        <DropdownMenuTrigger asChild>
          <Tugma
            aria-describedby="foydalanuvchi-izoh"
            className="data-[state=open]:border-asosiy"
          >
            {rasm !== null && (
              <img
                className="avatar"
                src={rasm}
                alt=""
                width={24}
                height={24}
              />
            )}
            {foydalanuvchi.ism}
            <ChevronDown size={16} />
          </Tugma>
        </DropdownMenuTrigger>
        {/* Ism o'ng chetda — ro'yxat ham o'ng chetga tekislanadi */}
        <DropdownMenuContent align="end">
          {/* 28-qism: chiqish — server so'rovi (Promise) */}
          <DropdownMenuItem
            onSelect={() => {
              void chiqish().then(setXato);
            }}
          >
            <LogOut size={16} />
            Chiqish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span id="foydalanuvchi-izoh" className="izoh">
        {" "}
        — kirgansiz
      </span>
      <span className="xato" role="alert">
        {xato}
      </span>
    </div>
  );
}
