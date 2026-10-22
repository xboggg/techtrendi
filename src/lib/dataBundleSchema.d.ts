export interface SchemaResult { ok: boolean; errors: string[] }
export function validateDataset(doc: unknown): SchemaResult;
export function compareToBaseline(doc: unknown, baseline: unknown): SchemaResult;
export const MAX_NETWORK_DROP: number;
export const UNIFORM_SHIFT: number[];
export const UNIFORM_SPREAD: number;
export const MAX_UNCONFIRMED_FLIP: number;
/** A single price, volume or rate moving outside this range needs an acceptedChanges entry (audit 8). */
export const MOVE_RANGE: number[];
export const MAX_FACTOR: number;
export const MAX_SHRINK: number;
/** A snapshot dated more than this into the future is not trusted (browser and prebuild). */
export const MAX_FUTURE_MS: number;
/** The first future date (beyond MAX_FUTURE_MS) of a row ({captured_at, checked_at, data}), or null. */
export function futureDate(row: unknown, now?: number): string | null;
export const REQUIRED_MB_PER_GB: number;
export const VOLATILE_FIELDS: string[];
export function contentKey(doc: unknown): string;
/** The checker's bundle order: network, family, price, mb (none first), name. */
export function compareBundles(a: unknown, b: unknown): number;
export function captureTime(s: unknown): number;
/** `row` is a snapshot row ({ captured_at, data }); `baseline` a dataset document. */
export function isStrictlyNewer(row: unknown, baseline: unknown): boolean;
export function bundleFilePath(country: string): string;
export function rowFromFile(body: unknown): { data: unknown; captured_at: string; checked_at: string | null } | null;
export function newerRow<T extends { captured_at: string; checked_at: string | null }>(a: T | null, b: T | null): T | null;
