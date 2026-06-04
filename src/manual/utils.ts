import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export const PROJECT_ROOT = process.cwd();

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function sanitizeFilePart(value: string): string {
  return value
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'manual';
}

export function createSessionId(now = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  return `session_${stamp}`;
}

export function writeJson(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function toRelativeArtifact(reportDir: string, filePath: string): string {
  return path.relative(reportDir, filePath).split(path.sep).join('/');
}

export function toFileUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDuration(start: string, end?: string): string {
  const startMs = Date.parse(start);
  const endMs = end ? Date.parse(end) : Date.now();
  const seconds = Math.max(0, Math.round((endMs - startMs) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes === 0) {
    return `${remainder}s`;
  }
  return `${minutes}m ${remainder}s`;
}

export function readDirectoryFiles(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const files: string[] = [];
  const visit = (currentDir: string): void => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  };

  visit(rootDir);
  return files.sort();
}
