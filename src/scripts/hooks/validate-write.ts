#!/usr/bin/env npx tsx
/**
 * PostToolUse hook for Write: Validate markdown file format
 *
 * Receives JSON via stdin with: tool_name, tool_input, tool_response
 * Validates diary entry files have proper structure.
 */

import { readFileSync, existsSync } from 'fs';
import type { HookInput, HookOutput } from './lib/types.js';

interface ValidationOutput extends HookOutput {
  validated: boolean;
  file?: string;
}

function main(): void {
  let input: HookInput;

  try {
    const stdin = readFileSync(0, 'utf-8');
    input = JSON.parse(stdin);
  } catch {
    // No valid input, exit silently
    console.log(JSON.stringify({ validated: true, success: true }));
    return;
  }

  const filePath = input.tool_input?.file_path;

  if (!filePath) {
    console.log(JSON.stringify({ validated: true, success: true }));
    return;
  }

  // Only validate markdown files
  if (!filePath.endsWith('.md')) {
    console.log(JSON.stringify({ validated: true, success: true }));
    return;
  }

  // Skip non-source files (match _original or any 2-letter language code)
  const sourcePattern = /content\/(_original|[a-z]{2})\//;
  if (!sourcePattern.test(filePath)) {
    console.log(JSON.stringify({ validated: true, success: true }));
    return;
  }

  // Skip workflow and glossary files
  if (filePath.includes('_workflow/') || filePath.includes('_glossary/')) {
    console.log(JSON.stringify({ validated: true, success: true }));
    return;
  }

  const warnings: string[] = [];

  // Check for paragraph ID format in entry files
  const entryPattern = /\d{4}-\d{2}-\d{2}\.md$/;
  if (entryPattern.test(filePath) && existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8');

    // Check if file has paragraph IDs
    const paragraphIdPattern = /\[\/\/\]: # \( \d+\.\d+ \)/;
    if (!paragraphIdPattern.test(content)) {
      warnings.push('Missing paragraph IDs');
    }

    // Check for date header
    const lines = content.split('\n');
    if (lines.length > 0 && !lines[0].startsWith('#')) {
      warnings.push('Missing date header');
    }
  }

  // If translation file (any language except _original), check for original French in comments
  const translationPattern = /content\/[a-z]{2}\//;
  const isTranslation = translationPattern.test(filePath) && !filePath.includes('content/_original/');

  if (isTranslation && entryPattern.test(filePath) && existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8');

    // Should have French text in comments
    const frenchCommentPattern = /\[\/\/\]: # \( [A-Za-z]/;
    if (!frenchCommentPattern.test(content)) {
      warnings.push('Translation may be missing French original in comments');
    }
  }

  const output: ValidationOutput = {
    validated: true,
    success: true,
    file: filePath,
  };

  if (warnings.length > 0) {
    output.warnings = warnings;
  }

  console.log(JSON.stringify(output));
}

main();
