// xususiyatlar/izoh — vazifa izohi, Markdown (21/#08). Ochiq API (18/#32)
export { VazifaIzohi } from "./VazifaIzohi.tsx";

// 21/#26: Markdown chizuvchi boshqa joyda ham (AI javobi) — kech chunk
import { lazy } from "react";
export const MarkdownMatn = lazy(() => import("./IzohKorinishi.tsx"));
