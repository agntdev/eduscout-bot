import type { Ctx } from "./bot.js";

export interface Resource {
  id: string;
  title: string;
  type: string;
  file_id: string;
  size: number;
  format: string;
  class_name: string;
  subject: string;
  premium_flag: boolean;
}

export interface Profile { telegram_id: number; premium_until: number; bookmarks: string[]; history: string[]; }

type Statement = { bind(...values: unknown[]): Statement; run(): Promise<unknown>; all<T>(): Promise<{ results?: T[] }>; first<T>(): Promise<T | null> };
type D1 = { prepare(query: string): Statement; exec(query: string): Promise<unknown> };
type DataCtx = Ctx & { env?: { DB?: unknown } };

function db(ctx: DataCtx): D1 | undefined {
  const candidate = ctx.env?.DB;
  return candidate && typeof (candidate as D1).prepare === "function" ? candidate as D1 : undefined;
}

async function ready(ctx: DataCtx): Promise<D1 | undefined> {
  const store = db(ctx);
  if (!store) return undefined;
  await store.exec(`CREATE TABLE IF NOT EXISTS studycrafter_resources (id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, file_id TEXT NOT NULL, size INTEGER NOT NULL, format TEXT NOT NULL, class_name TEXT NOT NULL, subject TEXT NOT NULL, premium_flag INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS studycrafter_profiles (telegram_id INTEGER PRIMARY KEY, premium_until INTEGER NOT NULL DEFAULT 0, bookmarks TEXT NOT NULL DEFAULT '[]', history TEXT NOT NULL DEFAULT '[]');
CREATE TABLE IF NOT EXISTS studycrafter_broadcasts (id INTEGER PRIMARY KEY AUTOINCREMENT, target_segment TEXT NOT NULL, message TEXT NOT NULL);`);
  return store;
}

export function userId(ctx: Ctx): number | undefined { return ctx.from?.id ?? ctx.chat?.id; }
export async function storageReady(ctx: Ctx): Promise<boolean> { try { return Boolean(await ready(ctx as DataCtx)); } catch { return false; } }

export async function resources(ctx: Ctx, where = "", values: unknown[] = []): Promise<Resource[]> {
  try { const store = await ready(ctx as DataCtx); if (!store) return []; const result = await store.prepare(`SELECT * FROM studycrafter_resources ${where} ORDER BY title LIMIT 100`).bind(...values).all<Resource>(); return result.results ?? []; } catch { return []; }
}
export async function resource(ctx: Ctx, id: string): Promise<Resource | undefined> {
  try { const store = await ready(ctx as DataCtx); return (await store?.prepare("SELECT * FROM studycrafter_resources WHERE id = ?").bind(id).first<Resource>()) ?? undefined; } catch { return undefined; }
}
export async function saveResource(ctx: Ctx, item: Resource): Promise<"saved" | "duplicate" | "unavailable"> {
  try { const store = await ready(ctx as DataCtx); if (!store) return "unavailable"; const prior = await store.prepare("SELECT id FROM studycrafter_resources WHERE id = ? OR file_id = ?").bind(item.id, item.file_id).first<{ id: string }>(); if (prior) return "duplicate"; await store.prepare("INSERT INTO studycrafter_resources (id,title,type,file_id,size,format,class_name,subject,premium_flag) VALUES (?,?,?,?,?,?,?,?,?)").bind(item.id,item.title,item.type,item.file_id,item.size,item.format,item.class_name,item.subject,item.premium_flag ? 1 : 0).run(); return "saved"; } catch { return "unavailable"; }
}
export async function removeResource(ctx: Ctx, id: string): Promise<boolean> { try { const store = await ready(ctx as DataCtx); if (!store) return false; await store.prepare("DELETE FROM studycrafter_resources WHERE id = ?").bind(id).run(); return true; } catch { return false; } }
async function profile(ctx: Ctx): Promise<Profile | undefined> {
  const id = userId(ctx); if (id === undefined) return undefined;
  try { const store = await ready(ctx as DataCtx); if (!store) return undefined; await store.prepare("INSERT OR IGNORE INTO studycrafter_profiles (telegram_id) VALUES (?)").bind(id).run(); const row = await store.prepare("SELECT * FROM studycrafter_profiles WHERE telegram_id = ?").bind(id).first<{ telegram_id: number; premium_until: number; bookmarks: string; history: string }>(); return row ? { telegram_id: row.telegram_id, premium_until: row.premium_until, bookmarks: JSON.parse(row.bookmarks), history: JSON.parse(row.history) } : undefined; } catch { return undefined; }
}
async function updateProfile(ctx: Ctx, next: Profile): Promise<boolean> { try { const store = await ready(ctx as DataCtx); if (!store) return false; await store.prepare("UPDATE studycrafter_profiles SET premium_until=?, bookmarks=?, history=? WHERE telegram_id=?").bind(next.premium_until, JSON.stringify(next.bookmarks), JSON.stringify(next.history), next.telegram_id).run(); return true; } catch { return false; } }
export async function bookmarks(ctx: Ctx): Promise<Resource[]> { const p = await profile(ctx); return p ? resources(ctx, `WHERE id IN (${p.bookmarks.map(() => "?").join(",") || "''"})`, p.bookmarks) : []; }
export async function history(ctx: Ctx): Promise<Resource[]> { const p = await profile(ctx); return p ? resources(ctx, `WHERE id IN (${p.history.map(() => "?").join(",") || "''"})`, p.history) : []; }
export async function toggleBookmark(ctx: Ctx, id: string): Promise<"saved" | "removed" | "unavailable"> { const p = await profile(ctx); if (!p) return "unavailable"; const at = p.bookmarks.indexOf(id); if (at >= 0) { p.bookmarks.splice(at, 1); await updateProfile(ctx,p); return "removed"; } p.bookmarks.push(id); await updateProfile(ctx,p); return "saved"; }
export async function viewed(ctx: Ctx, id: string): Promise<void> { const p = await profile(ctx); if (!p) return; p.history = [id, ...p.history.filter((x) => x !== id)].slice(0, 20); await updateProfile(ctx,p); }
export async function hasPremium(ctx: Ctx): Promise<boolean> { const p = await profile(ctx); return Boolean(p && p.premium_until > now()); }
export async function grantPremium(ctx: Ctx, until: number): Promise<void> { const p = await profile(ctx); if (!p) return; p.premium_until = Math.max(p.premium_until, until); await updateProfile(ctx,p); }
export async function saveBroadcast(ctx: Ctx, segment: string, message: string): Promise<boolean> { try { const store = await ready(ctx as DataCtx); if (!store) return false; await store.prepare("INSERT INTO studycrafter_broadcasts (target_segment,message) VALUES (?,?)").bind(segment,message).run(); return true; } catch { return false; } }
export async function recipientIds(ctx: Ctx, segment: "all" | "premium"): Promise<number[]> { try { const store = await ready(ctx as DataCtx); if (!store) return []; const result = await store.prepare(segment === "premium" ? "SELECT telegram_id FROM studycrafter_profiles WHERE premium_until > ?" : "SELECT telegram_id FROM studycrafter_profiles").bind(...(segment === "premium" ? [now()] : [])).all<{ telegram_id: number }>(); return (result.results ?? []).map((x) => x.telegram_id); } catch { return []; } }
export const now = (): number => Date.now();
