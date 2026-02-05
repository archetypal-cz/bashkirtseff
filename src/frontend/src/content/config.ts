import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Diary entry collection
 * Reads markdown files from content/_original/{carnet}/ and content/{lang}/{carnet}/
 * Files are named YYYY-MM-DD.md
 */
const diaryEntries = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: '../../../content',
  }),
  schema: z.object({
    // These will be inferred from the file path and content
    // since entries don't have frontmatter
  }).passthrough(),
});

/**
 * Glossary entries
 * Reads from content/_original/_glossary/
 */
const glossary = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: '../../../content/_original/_glossary',
  }),
  schema: z.object({}).passthrough(),
});

export const collections = {
  diary: diaryEntries,
  glossary,
};
