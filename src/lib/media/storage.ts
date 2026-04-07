import fs from "fs/promises";
import { statfs } from "fs/promises";
import path from "path";
import { MEDIA_FILES_DIR, MEDIA_CHUNKS_DIR, MIN_FREE_SPACE_BYTES } from "./config";

export async function ensureDirectories(): Promise<void> {
  await fs.mkdir(MEDIA_FILES_DIR, { recursive: true });
  await fs.mkdir(MEDIA_CHUNKS_DIR, { recursive: true });
}

export function getChunkDir(uploadId: string): string {
  return path.join(MEDIA_CHUNKS_DIR, uploadId);
}

export function getChunkPath(uploadId: string, chunkIndex: number): string {
  return path.join(getChunkDir(uploadId), `chunk_${chunkIndex}`);
}

export function getFilePath(diskFileName: string): string {
  const filePath = path.join(MEDIA_FILES_DIR, diskFileName);
  // Path traversal protection
  if (!path.resolve(filePath).startsWith(path.resolve(MEDIA_FILES_DIR))) {
    throw new Error("Invalid file name");
  }
  return filePath;
}

export async function writeChunk(
  uploadId: string,
  chunkIndex: number,
  data: Buffer
): Promise<void> {
  const chunkDir = getChunkDir(uploadId);
  await fs.mkdir(chunkDir, { recursive: true });
  await fs.writeFile(getChunkPath(uploadId, chunkIndex), data);
}

export async function getReceivedChunks(uploadId: string): Promise<number[]> {
  const chunkDir = getChunkDir(uploadId);
  try {
    const files = await fs.readdir(chunkDir);
    return files
      .filter((f) => f.startsWith("chunk_"))
      .map((f) => parseInt(f.replace("chunk_", ""), 10))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export async function assembleChunks(
  uploadId: string,
  totalChunks: number,
  diskFileName: string
): Promise<string> {
  const outputPath = getFilePath(diskFileName);
  const fileHandle = await fs.open(outputPath, "w");

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = getChunkPath(uploadId, i);
      const chunkData = await fs.readFile(chunkPath);
      await fileHandle.write(chunkData);
    }
  } finally {
    await fileHandle.close();
  }

  // Clean up chunks
  await deleteChunkDir(uploadId);

  return outputPath;
}

export async function deleteChunkDir(uploadId: string): Promise<void> {
  const chunkDir = getChunkDir(uploadId);
  try {
    await fs.rm(chunkDir, { recursive: true, force: true });
  } catch {
    // Ignore if already gone
  }
}

export async function deleteFile(diskFileName: string): Promise<void> {
  try {
    const filePath = getFilePath(diskFileName);
    await fs.unlink(filePath);
  } catch {
    // Ignore if already gone
  }
}

export async function fileExists(diskFileName: string): Promise<boolean> {
  try {
    await fs.access(getFilePath(diskFileName));
    return true;
  } catch {
    return false;
  }
}

export async function getFileSize(diskFileName: string): Promise<number> {
  const stat = await fs.stat(getFilePath(diskFileName));
  return stat.size;
}

/**
 * Check available disk space on the media storage partition.
 * Returns available bytes.
 */
export async function getFreeDiskSpace(): Promise<number> {
  const stats = await statfs(MEDIA_FILES_DIR);
  return stats.bavail * stats.bsize;
}

/**
 * Check if there's enough disk space for an operation.
 * @param requiredBytes - bytes needed for the operation
 * @returns true if enough space, false otherwise
 */
export async function hasEnoughDiskSpace(requiredBytes: number): Promise<boolean> {
  try {
    const free = await getFreeDiskSpace();
    // Must have enough for the operation AND maintain minimum free space floor
    return free - requiredBytes >= MIN_FREE_SPACE_BYTES;
  } catch {
    // If we can't check (e.g., Windows dev), allow the operation
    return true;
  }
}