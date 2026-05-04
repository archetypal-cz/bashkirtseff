#!/usr/bin/env npx tsx
import { ParagraphParser } from '../shared/src/parser/paragraph-parser.js';

const files = ['content/_original/092/1881-06-19.md', 'content/_original/093/1881-09-23.md', 'content/_original/100/1883-06-06.md'];
const parser = new ParagraphParser();

for (const f of files) {
  try {
    const entry = parser.parseFile(f);
    let badCount = 0;
    for (const para of entry.paragraphs) {
      for (const n of para.notes) {
        if (isNaN(n.timestamp.getTime())) {
          console.log(`${f} - ${para.id}: BAD TIMESTAMP in ${n.role}: "${n.content.substring(0, 60)}"`);
          badCount++;
        }
      }
    }
    if (badCount === 0) console.log(`${f}: all timestamps OK (${entry.paragraphs.length} paragraphs)`);
  } catch(e: any) {
    console.error(`${f}: PARSE ERROR: ${e.message}`);
  }
}
