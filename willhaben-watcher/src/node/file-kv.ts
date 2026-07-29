import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

interface Entry {
  value: string;
  /** Unix-Zeit in Sekunden, ab der der Eintrag ungültig ist. */
  expiresAt?: number;
}

/**
 * Ersatz für Cloudflare KV, wenn der Watcher außerhalb eines Workers läuft
 * (z. B. als GitHub Action). Der gesamte Stand liegt in einer JSON-Datei, die
 * nach dem Lauf wieder ins Repository eingecheckt wird.
 *
 * Umgesetzt ist nur, was der Watcher tatsächlich benutzt: get, put mit
 * expirationTtl, delete und list mit Präfix.
 */
export class FileKV {
  private constructor(
    private readonly file: string,
    private readonly entries: Map<string, Entry>,
  ) {}

  static async open(file: string): Promise<FileKV> {
    const entries = new Map<string, Entry>();
    try {
      const raw = JSON.parse(await readFile(file, "utf8")) as Record<string, Entry>;
      const now = Math.floor(Date.now() / 1000);
      for (const [key, entry] of Object.entries(raw)) {
        // Abgelaufenes gar nicht erst laden – hält die Datei klein.
        if (entry?.expiresAt !== undefined && entry.expiresAt <= now) continue;
        if (typeof entry?.value === "string") entries.set(key, entry);
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw new Error(`Zustandsdatei ${file} ist unlesbar: ${(err as Error).message}`);
      }
      // Erster Lauf: leerer Stand.
    }
    return new FileKV(file, entries);
  }

  async get(key: string, type?: "text" | "json"): Promise<unknown> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== undefined && entry.expiresAt <= Math.floor(Date.now() / 1000)) {
      this.entries.delete(key);
      return null;
    }
    return type === "json" ? JSON.parse(entry.value) : entry.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    const entry: Entry = { value };
    if (options?.expirationTtl !== undefined) {
      entry.expiresAt = Math.floor(Date.now() / 1000) + options.expirationTtl;
    }
    this.entries.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async list(options?: { prefix?: string }): Promise<{
    keys: { name: string }[];
    list_complete: true;
    cursor: undefined;
  }> {
    const prefix = options?.prefix ?? "";
    const keys = [...this.entries.keys()]
      .filter((key) => key.startsWith(prefix))
      .map((name) => ({ name }));
    return { keys, list_complete: true, cursor: undefined };
  }

  /** Schreibt den Stand sortiert zurück, damit git-Diffs klein bleiben. */
  async save(): Promise<void> {
    const sorted: Record<string, Entry> = {};
    for (const key of [...this.entries.keys()].sort()) {
      sorted[key] = this.entries.get(key)!;
    }
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, `${JSON.stringify(sorted, null, 1)}\n`, "utf8");
  }

  get size(): number {
    return this.entries.size;
  }
}
