import type { SavedBoard } from "./run";

// Per-browser library (IndexedDB: boards carry thumbnails, too big for localStorage). No accounts, no server.
const DB = "atlas-trend", STORE = "boards", KEEP = 50;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listBoards(): Promise<SavedBoard[]> {
  try {
    const all = await tx<SavedBoard[]>("readonly", (s) => s.getAll());
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return []; // private mode or storage blocked: history simply stays empty
  }
}

export async function saveBoard(board: SavedBoard): Promise<void> {
  try {
    await tx("readwrite", (s) => s.put(board));
    const all = await listBoards();
    for (const old of all.slice(KEEP)) await tx("readwrite", (s) => s.delete(old.id));
  } catch {
    // storage full or blocked: the board still shows, it just isn't kept
  }
}

export const deleteBoard = (id: string) => tx("readwrite", (s) => s.delete(id)).catch(() => undefined);
