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

  const entryPattern = /\d{4}-\d{2}-\d{2}\.md$/;
  if (entryPattern.test(filePath) && existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8');

    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
    if (!frontmatterMatch) {
      warnings.push('Missing YAML frontmatter block');
    } else {
      const frontmatter = frontmatterMatch[1];
      if (!/^date:/m.test(frontmatter)) {
        warnings.push('Frontmatter missing date:');
      }
      if (!/^carnet:/m.test(frontmatter)) {
        warnings.push('Frontmatter missing carnet:');
      }
    }

    const body = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content;

    if (!/%%\s*\d{3}\.\d{4}\s*%%/.test(body)) {
      warnings.push('Missing %% NNN.NNNN %% paragraph IDs');
    }

    const markerCount = (body.match(/%%/g) || []).length;
    if (markerCount % 2 !== 0) {
      warnings.push(`Unbalanced %% markers (${markerCount} found, expected an even count)`);
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
