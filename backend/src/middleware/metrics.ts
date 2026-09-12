import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
const started = Date.now();
let requests = 0, errors = 0;
const samples: number[] = [];
export const observeRequest: RequestHandler = (_req, res, next) => {
  const begin = performance.now();
  res.setHeader("X-Request-Id", randomUUID());
  res.on("finish", () => {
    requests++;
    if (res.statusCode >= 500) errors++;
    samples.push(performance.now() - begin);
    if (samples.length > 2000) samples.shift();
  });
  next();
};
export function metricsSnapshot() {
  const sorted = [...samples].sort((a, b) => a - b);
  const percentile = (p: number) => Math.round((sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? 0) * 100) / 100;
  return { requests, serverErrors: errors, errorRate: requests ? Math.round(errors / requests * 10000) / 100 : 0,
    p50Ms: percentile(.5), p95Ms: percentile(.95), sampleSize: samples.length,
    uptimeSeconds: Math.floor((Date.now() - started) / 1000), scope: "This API process; latency uses the latest 2000 completed requests" };
}
