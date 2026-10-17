import 'dotenv/config';
import { Temporal } from '@js-temporal/polyfill';

// Ensure global Temporal is present for Prisma 8 runtime
if (!('Temporal' in globalThis)) {
  // @ts-expect-error polyfill global Temporal
  globalThis.Temporal = Temporal;
}

import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d.js';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});

export { Temporal };

export function nowInstant(): Temporal.Instant {
  return Temporal.Now.instant();
}

export function instantFromMs(epochMs: number): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(epochMs);
}

export function instantFromDate(date: Date): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime());
}

export function epochMsFromInstant(instant: unknown): number {
  if (!instant) return 0;
  if (typeof (instant as { epochMilliseconds?: number }).epochMilliseconds === 'number') {
    return (instant as { epochMilliseconds: number }).epochMilliseconds;
  }
  return new Date(String(instant)).getTime();
}
