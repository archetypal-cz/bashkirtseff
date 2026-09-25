/**
 * Message lookup shared by the Vue composable (i18n/index.ts) and the
 * build-time `createT` (i18n/astro.ts). Kept free of Vue imports so .astro
 * pages and unit tests can use it directly.
 *
 * A message is either a string or, for counted phrases, an object of CLDR
 * plural categories keyed by `Intl.PluralRules#select`:
 *
 *   "relatedItems": {
 *     "one":   "{count} související položka",
 *     "few":   "{count} související položky",
 *     "other": "{count} souvisejících položek"
 *   }
 *
 * Plural objects are chosen by the numeric `count` param and must always carry
 * an `other` form (the fallback for categories a locale leaves out). `{count}`
 * is rendered with the locale's digit grouping ("3 671" in cs, "3,671" in en).
 */

export type MessageTree = { [key: string]: string | MessageTree };
export type MessageParams = Record<string, string | number>;

const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

function isPluralObject(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object') return false;
  const keys = Object.keys(value);
  return keys.includes('other') && keys.every(k => PLURAL_CATEGORIES.has(k));
}

const pluralRulesCache = new Map<string, Intl.PluralRules>();
const numberFormatCache = new Map<string, Intl.NumberFormat>();

function pluralRules(locale: string): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

/** Locale-grouped integer ("3 671" in cs, "3,671" in en). */
export function formatCount(count: number, locale: string): string {
  let format = numberFormatCache.get(locale);
  if (!format) {
    format = new Intl.NumberFormat(locale);
    numberFormatCache.set(locale, format);
  }
  return format.format(count);
}

/** Pick the plural form for `count`, falling back to `other`. */
export function selectPlural(forms: Record<string, string>, count: number, locale: string): string {
  const category = pluralRules(locale).select(count);
  return forms[category] ?? forms.other;
}

function lookup(tree: MessageTree, key: string): unknown {
  let value: unknown = tree;
  for (const part of key.split('.')) {
    if (value && typeof value === 'object' && part in (value as MessageTree)) {
      value = (value as MessageTree)[part];
    } else {
      return undefined;
    }
  }
  return value;
}

/** Replace `{name}` placeholders; unknown names are left in place. */
export function replacePlaceholders(str: string, params?: MessageParams): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => params[key]?.toString() ?? `{${key}}`);
}

/**
 * Resolve `key` in `tree` for `locale`. Returns the key itself when the message
 * is missing (the long-standing behaviour, visible in the UI rather than blank).
 */
export function resolveMessage(
  tree: MessageTree,
  key: string,
  locale: string,
  params?: MessageParams,
): string {
  const value = lookup(tree, key);
  if (typeof value === 'string') return replacePlaceholders(value, params);
  if (isPluralObject(value)) {
    const count = typeof params?.count === 'number' ? params.count : Number(params?.count);
    const template = Number.isFinite(count) ? selectPlural(value, count, locale) : value.other;
    const shown = Number.isFinite(count) ? { ...params, count: formatCount(count, locale) } : params;
    return replacePlaceholders(template, shown);
  }
  return key;
}
