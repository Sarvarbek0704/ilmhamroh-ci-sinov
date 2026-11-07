// ipc-toxta.ts — test qolipi (alohida jarayon, IPC kanali bilan — PM2 kabi): oddiy http server + jarayonniBoshqar. SIGTERM'dan keyin o'zi chiqishi kerak
import { createServer } from "node:http";
import { jarayonniBoshqar } from "../../src/jarayon.ts";

const server = createServer((_q, j) => { j.end("ok"); });
server.listen(0, "127.0.0.1", () => {
  jarayonniBoshqar(server, { info: (x) => { console.log(x); }, fatal: (x) => { console.error(x); } }, { kechikishMs: 0, kutishMs: 2000 });
  const a = server.address();
  console.log(typeof a === "object" && a !== null ? `http://127.0.0.1:${String(a.port)}` : "?");
});
// Windows'da boshqa jarayondan SIGTERM — ishlovchisiz TerminateProcess (24-qism #08). Shuning uchun signal IPC xabari bilan "yetkaziladi":
// process.emit — o'sha process.once("SIGTERM") ishlovchilarini chaqiradi (Linux'dagi haqiqiy signal bilan bir xil yo'l)
process.on("message", (x) => { if (x === "SIGTERM") process.emit("SIGTERM"); });
