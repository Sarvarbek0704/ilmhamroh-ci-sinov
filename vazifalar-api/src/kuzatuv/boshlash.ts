// boshlash.ts — 34-qism #15, #17 (O-59, O-61): ilovadan OLDIN yuklanadigan kuzatuv moduli (preload):
//   node --import ./dist/kuzatuv/boshlash.js dist/main.js      (Compose'da: NODE_OPTIONS=--import=./dist/kuzatuv/boshlash.js)
// Nega preload: OpenTelemetry http/express/pg modullarini ular import qilinishidan OLDIN "o'rab" oladi (ESM'da — import-in-the-middle hook'i).
// Hammasi IXTIYORIY: env berilmasa hech narsa yoqilmaydi (testlar, lokal dev — o'zgarishsiz).
//   OTEL_EXPORTER_OTLP_ENDPOINT (masalan http://otelcol:4318) — trace'lar (OTLP/HTTP); OTEL_TRACES_SAMPLER / _ARG — SDK o'zi o'qiydi (sukut: hammasi)
//   SENTRY_DSN — xatolar (Sentry SDK; GlitchTip — Sentry API bilan mos, self-hosted); APP_RELEASE — reliz (image tegi), SENTRY_SAMPLE_RATE — xato namunalash
import * as Sentry from "@sentry/node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { maxfiyTozala } from "./maxfiy.ts";

const reliz = process.env["APP_RELEASE"] ?? "lokal";

if ((process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "") !== "") {   // bo'sh qator = o'chiq (Compose ${VAR:-} bo'sh beradi)
  // ESM hook (import-in-the-middle) — NodeSDK.start() o'zi ro'yxatdan o'tkazadi. 34 #17 1-urinish: qo'lda `module.register(hook.mjs)` ham qilgandim —
  //   "The 'import-in-the-middle' hook has already been initialized" ogohlantirishi (ikki marta) → olib tashlandi.
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: process.env["OTEL_SERVICE_NAME"] ?? "vazifalar-api", [ATTR_SERVICE_VERSION]: reliz }),
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [
      // /health va /metrics trace'lari — shovqin (Prometheus har 15 s, healthcheck har 10 s)
      new HttpInstrumentation({ ignoreIncomingRequestHook: (req) => /^\/(health|metrics)/.test(req.url ?? "") }),
      new ExpressInstrumentation(),
      new NestInstrumentation(),
      new PgInstrumentation({ enhancedDatabaseReporting: false }),   // SQL parametrlari (shaxsiy ma'lumot) span'ga yozilmaydi
      // log ↔ trace — src/umumiy/log.ts (Pino mixin); instrumentation-pino ESM nomli importda ishlamadi (34 #17 1-urinish)
    ],
  });
  sdk.start();
  process.once("SIGTERM", () => { void sdk.shutdown(); });
}

if ((process.env["SENTRY_DSN"] ?? "") !== "") {
  Sentry.init({
    dsn: process.env["SENTRY_DSN"],
    release: reliz,
    environment: process.env["APP_MUHIT"] ?? process.env["NODE_ENV"] ?? "development",
    sampleRate: Number(process.env["SENTRY_SAMPLE_RATE"] ?? "1"),
    // trace'lar — o'z OpenTelemetry SDK'imizda (yuqorida); Sentry o'z OTel'ini qurmasin (ikki TracerProvider to'qnashadi)
    // tracesSampleRate berilmaydi — Sentry tracing o'chiq (trace'lar — Collector/Jaeger)
    skipOpenTelemetrySetup: true,
    sendDefaultPii: false,
    beforeSend: (hodisa) => maxfiyTozala(hodisa),
  });
}
