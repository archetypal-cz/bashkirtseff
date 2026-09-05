import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { ParagraphParser } from '../parser/paragraph-parser.js';
import { TranslationScaffold, createDefaultScaffoldOptions } from './scaffold.js';

const ORIGINAL = [
  '---',
  'date: 1876-07-08',
  'carnet: "063"',
  'research_complete: true',
  '---',
  '%% 063.0001 %%',
  "%% Hier a deux heures j'ai quitte Nice. %%",
  '%% 2026-01-01T10:00:00 LAN: period vocabulary %%',
  "Hier a deux heures j'ai quitte Nice.[^1]",
  '',
  '%% 063.0002 %%',
  '%% Le train est parti a six heures. %%',
  'Le train est parti a six heures.',
  '',
  '[^1]: Nice, on the Promenade des Anglais.',
  '',
].join('\n');

// An already-worked translation: approved, one translated footnote, and a TR note
// sitting on a paragraph that is still TODO.
const TRANSLATION = [
  '---',
  'date: 1876-07-08',
  'carnet: "063"',
  'language: uk',
  'translation_complete: true',
  'conductor_approved: true',
  '---',
  '%% 063.0001 %%',
  "%% Hier a deux heures j'ai quitte Nice. %%",
  '%% 2026-01-01T10:00:00 LAN: period vocabulary %%',
  'Учора о другій я виїхала з Ніцци.[^1]',
  '',
  '%% 063.0002 %%',
  '%% Le train est parti a six heures. %%',
  '%% 2026-02-02T11:00:00 TR: left for the editor — check the train idiom %%',
  'TODO',
  '',
  '[^1]: Ніцца, на Променад-дез-Англе.',
  '',
].join('\n');

function fixture(): { originalPath: string; translationPath: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bashk-scaffold-'));
  const originalDir = path.join(dir, 'content', '_original', '063');
  const translationDir = path.join(dir, 'content', 'uk', '063');
  fs.mkdirSync(originalDir, { recursive: true });
  fs.mkdirSync(translationDir, { recursive: true });

  const originalPath = path.join(originalDir, '1876-07-08.md');
  const translationPath = path.join(translationDir, '1876-07-08.md');
  fs.writeFileSync(originalPath, ORIGINAL, 'utf-8');
  fs.writeFileSync(translationPath, TRANSLATION, 'utf-8');

  return { originalPath, translationPath, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('overwrite scaffold preserves approval flags, translated footnotes and TODO-paragraph notes', () => {
  const { originalPath, translationPath, cleanup } = fixture();
  try {
    const scaffold = new TranslationScaffold();
    const result = scaffold.scaffoldEntryFile(originalPath, translationPath, {
      ...createDefaultScaffoldOptions(),
      targetLanguage: 'uk',
      overwrite: true,
    });

    assert.equal(result.created, true, result.reason ?? 'expected the file to be written');

    const out = fs.readFileSync(translationPath, 'utf-8');

    // Frontmatter: the translation's own approval state survives.
    assert.match(out, /^conductor_approved: true$/m);
    assert.match(out, /^translation_complete: true$/m);
    // …and is not clobbered back to a pending scaffold.
    assert.doesNotMatch(out, /^status: translation_pending$/m);

    // Footnotes: the translated definition survives, untouched by the French one.
    assert.match(out, /^\[\^1\]: Ніцца, на Променад-дез-Англе\.$/m);
    assert.doesNotMatch(out, /Promenade des Anglais/);

    // Notes on a paragraph that is still TODO survive.
    assert.match(out, /TR: left for the editor — check the train idiom/);
    // The TODO placeholder itself is kept.
    assert.match(out, /^TODO$/m);

    // The finished translation is still there.
    assert.match(out, /Учора о другій я виїхала з Ніцци\./);
  } finally {
    cleanup();
  }
});

test('overwrite scaffold keeps a translated heading', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bashk-scaffold-hdr-'));
  try {
    const originalPath = path.join(dir, 'src.md');
    const translationPath = path.join(dir, 'uk.md');
    fs.writeFileSync(originalPath, '---\ndate: 1876-07-13\ncarnet: "063"\n---\n# Jeudi 13 juillet 1876\n', 'utf-8');
    fs.writeFileSync(
      translationPath,
      '---\ndate: 1876-07-13\ncarnet: "063"\nconductor_approved: true\n---\n\n# Четвер, 13 липня 1876\n',
      'utf-8'
    );

    const result = new TranslationScaffold().scaffoldEntryFile(originalPath, translationPath, {
      ...createDefaultScaffoldOptions(),
      targetLanguage: 'uk',
      overwrite: true,
    });

    // Without this the assertions below could pass on the untouched fixture.
    assert.equal(result.created, true, result.reason ?? 'expected the file to be rewritten');

    const out = fs.readFileSync(translationPath, 'utf-8');
    // A heading has no `%% French %%` comment to distinguish it, so it must not be
    // mistaken for an untranslated paragraph and stamped over with TODO.
    assert.match(out, /^# Четвер, 13 липня 1876$/m);
    assert.doesNotMatch(out, /^# TODO$/m);
    // Nor may the French heading take the heading line back.
    assert.doesNotMatch(out, /^# Jeudi 13 juillet 1876$/m);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scaffold without an existing translation still produces a pending stub', () => {
  const { originalPath, translationPath, cleanup } = fixture();
  try {
    fs.rmSync(translationPath);

    const scaffold = new TranslationScaffold();
    const result = scaffold.scaffoldEntryFile(originalPath, translationPath, {
      ...createDefaultScaffoldOptions(),
      targetLanguage: 'uk',
    });

    assert.equal(result.created, true, result.reason ?? 'expected the file to be written');

    const out = fs.readFileSync(translationPath, 'utf-8');
    assert.match(out, /^status: translation_pending$/m);
    assert.match(out, /^language: uk$/m);
    assert.equal(result.paragraphsWithTodo, 2);
    // Source-only workflow flags must not leak into the translation frontmatter.
    assert.doesNotMatch(out, /^research_complete:/m);
  } finally {
    cleanup();
  }
});

test('overwrite scaffold keeps a header paragraph its glossary tag and its notes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bashk-scaffold-hdrmeta-'));
  try {
    const originalDir = path.join(dir, 'content', '_original', '063');
    const translationDir = path.join(dir, 'content', 'uk', '063');
    fs.mkdirSync(originalDir, { recursive: true });
    fs.mkdirSync(translationDir, { recursive: true });
    const originalPath = path.join(originalDir, '1876-07-13.md');
    const translationPath = path.join(translationDir, '1876-07-13.md');
    fs.writeFileSync(
      originalPath,
      [
        '---',
        'date: 1876-07-13',
        'carnet: "063"',
        '---',
        '%% 063.0100 %%',
        '%% [#Nice](../_glossary/places/cities/NICE.md) %%',
        '# Jeudi 13 juillet 1876',
        '',
        '%% 063.0101 %%',
        '%% Le train est parti. %%',
        'Le train est parti.',
        '',
      ].join('\n'),
      'utf-8'
    );
    fs.writeFileSync(
      translationPath,
      [
        '---',
        'date: 1876-07-13',
        'carnet: "063"',
        'language: uk',
        'conductor_approved: true',
        '---',
        '%% 063.0100 %%',
        '%% Jeudi 13 juillet 1876 %%',
        '%% [#Nice](../_glossary/places/cities/NICE.md) %%',
        '%% 2026-02-02T11:00:00 TR: heading date form follows the Ukrainian convention %%',
        '# Четвер, 13 липня 1876',
        '',
        '%% 063.0101 %%',
        '%% Le train est parti. %%',
        'Потяг рушив.',
        '',
      ].join('\n'),
      'utf-8'
    );

    const result = new TranslationScaffold().scaffoldEntryFile(originalPath, translationPath, {
      ...createDefaultScaffoldOptions(),
      targetLanguage: 'uk',
      overwrite: true,
    });
    assert.equal(result.created, true, result.reason ?? 'expected the file to be rewritten');

    // Parse the rendered output back: the header paragraph must still carry both.
    const reparsed = new ParagraphParser().parseFile(translationPath);
    const header = reparsed.paragraphs.find(p => p.isHeader);
    assert.ok(header, 'expected a header paragraph in the scaffolded output');
    assert.equal(header.id, '063.0100');
    assert.equal(header.translatedText, 'Четвер, 13 липня 1876');
    assert.deepEqual(header.glossaryLinks.map(l => l.displayText), ['Nice']);
    assert.deepEqual(
      header.notes.map(n => `${n.role}: ${n.content}`),
      ['TR: heading date form follows the Ukrainian convention']
    );

    // The paragraph after the header must not have absorbed the header's notes.
    const body = reparsed.paragraphs.find(p => p.id === '063.0101');
    assert.ok(body, 'expected the body paragraph to survive');
    assert.equal(body.notes.length, 0);
    assert.equal(body.glossaryLinks.length, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
