import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { RollResult } from "../types";

interface DiceDB extends DBSchema {
  rolls: {
    key: string;
    value: RollResult;
    indexes: { "by-time": number };
  };
  prefs: {
    key: string;
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<DiceDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<DiceDB>("dice-tray", 1, {
      upgrade(db) {
        const store = db.createObjectStore("rolls", { keyPath: "id" });
        store.createIndex("by-time", "timestamp");
        db.createObjectStore("prefs");
      },
    });
  }
  return dbPromise;
}

export async function saveRoll(r: RollResult): Promise<void> {
  const d = await db();
  await d.put("rolls", r);
}

export async function getRolls(limit = 200): Promise<RollResult[]> {
  const d = await db();
  const tx = d.transaction("rolls", "readonly");
  const idx = tx.store.index("by-time");
  const out: RollResult[] = [];
  let cursor = await idx.openCursor(null, "prev");
  while (cursor && out.length < limit) {
    out.push(cursor.value);
    cursor = await cursor.continue();
  }
  return out;
}

export async function clearRolls(): Promise<void> {
  const d = await db();
  await d.clear("rolls");
}

export async function getPref<T = unknown>(key: string): Promise<T | undefined> {
  const d = await db();
  return (await d.get("prefs", key)) as T | undefined;
}

export async function setPref(key: string, value: unknown): Promise<void> {
  const d = await db();
  await d.put("prefs", value, key);
}
