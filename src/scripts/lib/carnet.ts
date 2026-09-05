/** Normalize a carnet argument to the canonical three-digit id ("2" -> "002"). */
export function normalizeCarnet(arg: string): string {
  const invalid = new Error(`Invalid carnet "${arg}" — expected 1-3 digits (000-106)`);
  if (!/^\d{1,3}$/.test(arg)) {
    throw invalid;
  }
  // The digit test alone still admits 107-999, which name no carnet.
  const num = Number(arg);
  if (num > 106) {
    throw invalid;
  }
  return arg.padStart(3, '0');
}
