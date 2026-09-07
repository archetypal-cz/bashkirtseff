import { defineConfig } from 'vitest/config';

// The comment-marker tests build a throwaway content tree and import the
// content loader inside `beforeAll`; that first import transforms the whole
// module graph and routinely takes longer than vitest's 10 s hook default.
export default defineConfig({
  test: {
    hookTimeout: 120_000,
  },
});
