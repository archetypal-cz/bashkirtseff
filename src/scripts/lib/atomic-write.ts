import * as fs from 'node:fs';

/** Write via a same-directory temp file + rename so a crash never leaves a truncated target. */
export function writeFileAtomic(filePath: string, content: string): void {
  const tmp = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tmp, content, 'utf-8');
    if (fs.existsSync(filePath)) fs.chmodSync(tmp, fs.statSync(filePath).mode);
    fs.renameSync(tmp, filePath);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}
