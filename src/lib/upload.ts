import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function uploadFile(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const relativePath = join("/uploads", folder, `${Date.now()}_${file.name}`);
  const absolutePath = join(process.cwd(), "public", relativePath);

  // Ensure directory exists
  await mkdir(join(process.cwd(), "public", "uploads", folder), { recursive: true });

  await writeFile(absolutePath, new Uint8Array(buffer));

  // Convert Windows backslashes to forward slashes for URLs
  return relativePath.replace(/\\/g, "/");
}
