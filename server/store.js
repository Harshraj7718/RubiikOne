// Tiny JSON-file store with serialized writes, so two simultaneous pre-bookings
// can never both take the last piece.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";

const EMPTY = { orders: [], waitlist: [] };

export async function createStore(file) {
  await mkdir(path.dirname(file), { recursive: true });
  let queue = Promise.resolve();

  async function read() {
    try {
      return { ...EMPTY, ...JSON.parse(await readFile(file, "utf8")) };
    } catch (err) {
      if (err.code === "ENOENT") return structuredClone(EMPTY);
      throw err;
    }
  }

  function update(mutate) {
    const run = queue.then(async () => {
      const db = await read();
      await mutate(db);
      const tmp = `${file}.tmp`;
      await writeFile(tmp, JSON.stringify(db, null, 2));
      await rename(tmp, file);
      return db;
    });
    queue = run.catch(() => {});
    return run;
  }

  return { read, update };
}
