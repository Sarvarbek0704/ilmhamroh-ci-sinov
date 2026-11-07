// rol-parollari.mjs — 33-qism #32 (Compose `migratsiya` servisi): migratsiyalar ilova rollarini PAROLSIZ yaratadi (lokal trust kanon) — Docker/serverda
// scram-sha-256 bilan kirish uchun parol kerak. Parollar muhitdan (Compose .env), qiymat logga chiqmaydi. Superuser DATABASE_URL bilan ishga tushiriladi.
import pg from "pg";

const rollar = { vazifalar_api: "API_DB_PAROL", vazifalar_auth: "AUTH_DB_PAROL", vazifalar_ishchi: "ISHCHI_DB_PAROL" };
const ulanish = new pg.Client({ connectionString: process.env.DATABASE_URL });
await ulanish.connect();
try {
  for (const [rol, ozgaruvchi] of Object.entries(rollar)) {
    const parol = process.env[ozgaruvchi];
    if (!parol || parol.length < 16) throw new Error(`${ozgaruvchi} yo'q yoki 16 belgidan qisqa`);
    // ALTER ROLE parametrni qabul qilmaydi — literal format() bilan (SQL injection'dan himoya — quote_literal)
    const { rows } = await ulanish.query("SELECT format('ALTER ROLE %I PASSWORD %L', $1::text, $2::text) AS sql", [rol, parol]);
    await ulanish.query(rows[0].sql);
    console.log(`parol o'rnatildi: ${rol}`);
  }
} finally {
  await ulanish.end();
}
