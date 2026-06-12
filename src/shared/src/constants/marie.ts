/**
 * Canonical dates for Marie Bashkirtseff.
 *
 * There are THREE dates that circulate for Marie's birth; this module is the
 * single source of truth so the frontend, schema.org markup, age calculations,
 * and scripts can never drift apart again (they previously disagreed by up to
 * two years — audit issue M9).
 *
 * REAL BIRTH DATE — 1858-11-24 (Gregorian / New Style)
 *   This is the date used by the project's own glossary entry
 *   (`content/_original/_glossary/people/family/MARIE_BASHKIRTSEFF.md`,
 *   chronology table and lede: "24 November 1858 – 31 October 1884") and by
 *   most modern reference works (AWARE, Clark Art Institute, JSTOR Daily).
 *   Marie was born near Poltava, then in the Russian Empire (present-day
 *   Ukraine). Russia used the Julian calendar (Old Style) in 1858; 24 Nov N.S.
 *   corresponds to 12 Nov O.S. — and Kernberger (2013) reports the true day as
 *   "November 12, 1858" (Old Style), i.e. the SAME day under the calendar
 *   Marie's family actually used. We expose the N.S. (Gregorian) form because
 *   all entry dates in the diary are already Gregorian, so age arithmetic
 *   against Gregorian entry dates must use the Gregorian birth date.
 *
 * CLAIMED BIRTH DATE — 1860-11-24
 *   Marie (and her family) publicly claimed she was born in 1860, making her
 *   appear two years younger. Per Kernberger (2013) the family had long
 *   maintained that she was born prematurely (celebrating a January birthday)
 *   to conceal that she was a full-term child born seven months after her
 *   parents' marriage; the false "1860" was even engraved on her tomb. Marie
 *   learned the truth from her father in 1878.
 *
 * DISPLAYED AGES use the REAL date. This is a scholarly edition, so "Marie was
 * N years old" reflects her actual age; her own (younger) claim is documented
 * here and in the glossary rather than propagated into computed ages.
 *
 * Source: Katherine Kernberger, "I Am the Most Interesting Book of All" (Vol I)
 * / "Lust for Glory" (Vol II), Fonthill Press, 2013; project glossary entry
 * MARIE_BASHKIRTSEFF.
 */

/** Marie's real birth date (Gregorian / N.S.), ISO YYYY-MM-DD. Use for ages. */
export const MARIE_BIRTH_DATE = '1858-11-24';

/** The (false) birth date Marie publicly claimed, ISO YYYY-MM-DD. */
export const MARIE_CLAIMED_BIRTH_DATE = '1860-11-24';

/** Year/month(1-12)/day of the real birth date, for arithmetic without Date(). */
export const MARIE_BIRTH_YEAR = 1858;
export const MARIE_BIRTH_MONTH = 11; // November (1-indexed)
export const MARIE_BIRTH_DAY = 24;

/** Marie's death date (Gregorian), ISO YYYY-MM-DD. */
export const MARIE_DEATH_DATE = '1884-10-31';
