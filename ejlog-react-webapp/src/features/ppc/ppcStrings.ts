import strings from './ppcStrings.it.json';

type PpcStrings = Record<string, string>;

const ppcStrings = strings as PpcStrings;

export function ppcT(key: string, fallback?: string): string {
  return ppcStrings[key] ?? fallback ?? key;
}
