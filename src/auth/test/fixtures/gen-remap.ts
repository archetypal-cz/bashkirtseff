// Writes two renumber scripts for carnet 099 with the REAL generator (sqlRemap), for remap.test.sh:
//   <out>/099-2026-10-02.sql    a shift chain  0003->0004, 0004->0005, 0005->0006
//   <out>/099-2026-10-02-2.sql  a merge        0005->0004, 0006->0004, 0007->0005 (and one dropped paragraph, 0009)
// Usage: npx tsx src/auth/test/fixtures/gen-remap.ts <out-dir>
import * as fs from 'node:fs';
import * as path from 'node:path';
import { sqlRemap } from '../../../scripts/lib/rebuild-carnet-core.ts';

const out = process.argv[2];
if (!out) throw new Error('usage: gen-remap.ts <out-dir>');
const mapping = (ids: [string, string][], dropped: string[] = []) =>
  ({ carnet: '099', idMap: new Map(ids), dropped: new Map(dropped.map((d) => [d, 'merged'])) }) as unknown as Parameters<typeof sqlRemap>[0];

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, '099-2026-10-02.sql'), sqlRemap(mapping([['099.0003', '099.0004'], ['099.0004', '099.0005'], ['099.0005', '099.0006']]), '2026-10-02'));
fs.writeFileSync(path.join(out, '099-2026-10-02-2.sql'), sqlRemap(mapping([['099.0005', '099.0004'], ['099.0006', '099.0004'], ['099.0007', '099.0005']], ['099.0009']), '2026-10-02'));
