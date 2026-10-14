import { readFile } from "node:fs/promises";

/** Reads a UTF-8 text file, dropping a byte-order mark (Windows editors often add one). */
export async function readText(filePath: string): Promise<string> {
  return (await readFile(filePath, "utf8")).replace(/^\uFEFF/, "");
}

export async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readText(filePath));
}
