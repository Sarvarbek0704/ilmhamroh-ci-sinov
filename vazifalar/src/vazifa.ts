// vazifa.ts — bitta vazifa va vazifalar xatosi
import type { VazifaMalumoti, VazifaXatosiKodi } from "./turlar.ts";

export class VazifaXatosi extends Error {
  readonly kod: VazifaXatosiKodi;

  constructor(
    xabar: string,
    sozlama?: ErrorOptions & { kod?: VazifaXatosiKodi },
  ) {
    super(xabar, sozlama);
    this.name = "VazifaXatosi";
    this.kod = sozlama?.kod ?? "NOMALUM";
  }
}

// O'zgarmas qiymat (17/#14): o'zgartirish — yangi ro'yxat (amallar.ts).
// v6 dagi almashtir() va matnniOzgartir() — amallar.ts da, massiv bilan
export class Vazifa {
  // <input maxLength> ham shu son (YangiVazifaForma, TahrirQatori)
  static readonly MAKS_UZUNLIK = 100;

  readonly id: number;
  readonly matn: string;
  readonly bajarildi: boolean;

  constructor(id: number, matn: string, bajarildi = false) {
    this.id = id;
    this.matn = matn;
    this.bajarildi = bajarildi;
  }

  static dan(malumot: VazifaMalumoti): Vazifa {
    return new Vazifa(malumot.id, malumot.matn, malumot.bajarildi);
  }

  toJSON(): VazifaMalumoti {
    return { id: this.id, matn: this.matn, bajarildi: this.bajarildi };
  }
}
