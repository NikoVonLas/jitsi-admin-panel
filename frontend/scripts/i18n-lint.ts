#!/usr/bin/env -S deno run --allow-read
/**
 * i18n lint script
 * Checks:
 * 1. All keys in en.ts exist in ru.ts and vice versa (symmetry)
 * 2. All t('key') usages in .tsx files have a corresponding key in translations
 * 3. No unused keys in translation files
 * Exits with code 1 if any issues found, prints a report
 */

import { walk } from 'https://deno.land/std@0.224.0/fs/walk.ts';
import { join, dirname, fromFileUrl } from 'https://deno.land/std@0.224.0/path/mod.ts';

const __dirname = dirname(fromFileUrl(import.meta.url));
const srcDir = join(__dirname, '..', 'src');
const i18nDir = join(srcDir, 'i18n');

// --- Parse translation files ---

function parseTranslationKeys(filePath: string): Set<string> {
  const content = Deno.readTextFileSync(filePath);
  const keys = new Set<string>();
  // Match 'key': or "key":
  const keyRegex = /['"]([^'"]+)['"]\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = keyRegex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

// --- Collect all t('key') usages from .tsx files ---

async function collectUsedKeys(knownKeys: Set<string>): Promise<Map<string, string[]>> {
  const usedKeys = new Map<string, string[]>(); // key -> [file, ...]

  for await (const entry of walk(srcDir, {
    exts: ['.tsx', '.ts'],
    skip: [/node_modules/, /\.d\.ts$/, /i18n\//],
  })) {
    if (!entry.isFile) continue;
    const content = await Deno.readTextFile(entry.path);
    // Match t('key'), t("key"), tr('key'), tr("key") — direct calls
    const usageRegex = /\btr?\(['"]([^'"]+)['"]\)/g;
    let match: RegExpExecArray | null;
    while ((match = usageRegex.exec(content)) !== null) {
      const key = match[1];
      if (!usedKeys.has(key)) usedKeys.set(key, []);
      usedKeys.get(key)!.push(entry.path.replace(srcDir + '/', ''));
    }
    // Also match string literals that look like i18n keys in arrays/objects
    // e.g. const KEYS = ['cal.sun', 'cal.mon', ...] where t(KEYS[i]) is called later
    // Only count if the key actually exists in translations (avoids false positives like 'qr.png')
    const literalRegex = /['"]((?:[a-z][a-z0-9_]*\.){1,}[a-z][a-z0-9_.]*)['"](?!\s*:)/g;
    while ((match = literalRegex.exec(content)) !== null) {
      const key = match[1];
      if (!knownKeys.has(key)) continue; // not a translation key, skip
      if (!usedKeys.has(key)) usedKeys.set(key, []);
      usedKeys.get(key)!.push(entry.path.replace(srcDir + '/', '') + ' (literal)');
    }
  }

  return usedKeys;
}

// --- Main ---

const enKeys = parseTranslationKeys(join(i18nDir, 'en.ts'));
const ruKeys = parseTranslationKeys(join(i18nDir, 'ru.ts'));

const usedKeys = await collectUsedKeys(enKeys);

let hasErrors = false;

// 1. Symmetry check: keys in en but not in ru
const missingInRu = [...enKeys].filter((k) => !ruKeys.has(k));
// Keys in ru but not in en
const missingInEn = [...ruKeys].filter((k) => !enKeys.has(k));

if (missingInRu.length > 0) {
  hasErrors = true;
  console.error('\n❌ Keys in en.ts but missing in ru.ts:');
  for (const k of missingInRu.sort()) {
    console.error(`   - ${k}`);
  }
}

if (missingInEn.length > 0) {
  hasErrors = true;
  console.error('\n❌ Keys in ru.ts but missing in en.ts:');
  for (const k of missingInEn.sort()) {
    console.error(`   - ${k}`);
  }
}

// 2. Used keys not in translations
const missingInTranslations: string[] = [];
for (const [key, files] of usedKeys) {
  if (!enKeys.has(key)) {
    missingInTranslations.push(`   - '${key}' (used in: ${[...new Set(files)].slice(0, 3).join(', ')})`);
    hasErrors = true;
  }
}

if (missingInTranslations.length > 0) {
  console.error('\n❌ Keys used in code but missing in en.ts:');
  for (const line of missingInTranslations.sort()) {
    console.error(line);
  }
}

// 3. Unused keys
const unusedKeys = [...enKeys].filter((k) => !usedKeys.has(k));

if (unusedKeys.length > 0) {
  console.warn('\n⚠️  Keys defined in translations but not used in .tsx/.ts files:');
  for (const k of unusedKeys.sort()) {
    console.warn(`   - ${k}`);
  }
  hasErrors = true; // unused keys are an error — remove or use them
}

// Summary
if (!hasErrors) {
  console.log(`\n✅ i18n lint passed. en: ${enKeys.size} keys, ru: ${ruKeys.size} keys, used: ${usedKeys.size} keys.`);
} else {
  console.error(`\n✗ i18n lint failed. Fix the above issues.`);
  Deno.exit(1);
}
