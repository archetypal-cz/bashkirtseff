# Newspaper titles: Gallica arks and other libraries (2026-10-24)

A Gallica title ark is `cb` + the BnF catalogue number; Wikidata property P268 (BnF ID) carries it, so most arks below come from Wikidata (queried with the SPARQL endpoint) and are marked **unverified** until one date URL has been opened. URL pattern: `https://gallica.bnf.fr/ark:/12148/<cb…>/dateYYYYMMDD` resolves to the issue of that date (`…bpt6k….item`); a date with no issue gives an error page, and evening papers carry the NEXT day's date (085.0479: «le Gaulois», «l'Estafette», «Le Pays» "portent la date du lendemain").

**Verification status.** Verified with the Windmill scraper (page title shows paper and date):

| Title | Ark | Date tested | Result |
|---|---|---|---|
| Le Figaro | cb34355551z | 1876-11-07 (lead), 1884-04-30 (me) | `bpt6k276148f` (7 Nov 1876, no. 312); `bpt6k278920r` "Figaro : journal non politique \| 1884-04-30" |
| Le Temps | cb34431794k | 1884-05-16 | `bpt6k2303001`, "Le Temps \| 1884-05-16 \| Gallica" |
| Le Pays | cb328343740 | 1878-04-11 | `bpt6k4670061v`, "Le Pays : journal des volontés de la France \| 1878-04-11 \| Gallica" |
| Le Voltaire | cb32892208p | 1884-04-30 | redirects to **RetroNews** (`retronews.fr/journal/le-voltaire/30-avril-1884/2273/3640925/1`): not free on Gallica, BnF's paid press site |

**All other titles are unverified.** After the third call Cloudflare put a "verify you are human" challenge in front of gallica.bnf.fr for this machine (probably the request rate: ~12 requests in ~10 minutes; every date URL from the 4th on returned the challenge page "Okamžik…" even after a 45 s retry). I did not click or bypass it. Re-verify the arks below with ONE request per minute at most, after the block expires, before any link is written into the content.

## Titles in the inventory

| Title (diary years) | Gallica ark (source) | Status | Notes |
|---|---|---|---|
| Le Figaro (all) | cb34355551z | verified | free in Gallica for 1826–1942. Page-level link: `…/bpt6k<issue>/f<N>.item` |
| Le Gaulois (1879–84) | cb32779904b (Wikidata) | unverified | Wikidata also lists cb32779902n (1866 predecessor) and cb327799061 |
| Le Pays (1876–83) | cb328343740 (Wikidata) | verified for 1878-04-11 | |
| Le Temps | cb34431794k | verified | |
| L'Estafette (1878–80) | cb327695777 (Wikidata) | unverified | evening paper |
| Gil Blas (1881–83) | cb344298410 (Wikidata; founded 1879 series) | unverified | |
| La République française | cb32853032d (Wikidata) | unverified | |
| Le Voltaire (1880–84) | cb32892208p (Wikidata) | verified, **RetroNews only** | 1878 Voltaire is a different series from the 1880 revival; check both |
| La Vie parisienne | cb328892561 (Wikidata; a second record cb139167461 exists) | unverified | weekly, Saturdays; nearly all diary mentions are the operetta, not the paper |
| Le Sport | cb328718467 (Wikidata "Le Sport", French periodical) | unverified, **might be the wrong "Le Sport"** | an ISSN record says «Le Sport (Paris. 1854)» is preserved on Gallica; check that issues of Jan 1877 / 1881–84 exist |
| La Citoyenne (Hubertine Auclert, 1881–91) | not found | to search | Wikidata Q457995 has no BnF ID; issues of 1881 are digitised by Alexander Street ("Women and Social Movements", paid); the BnF holds the title, find the ark by browsing Gallica «Presse» → "La Citoyenne" (needs a human browser; Cloudflare) |
| La Vie mondaine (Nice, 1873–82) | not found | to search | local Nice weekly; probably not on Gallica; try the Archives départementales des Alpes-Maritimes / Nice Historique / Mediathèque de Nice (Numérique) |
| Les Échos de Nice | not found | to search | same libraries as above |
| Le Patriote niçois | not found | to search | same |
| Le Phare du Littoral | not found | to search | same |
| Journal des débats | cb39294634r (Wikidata) | unverified | only 1–2 mentions (Deschanel) |
| Le Rappel | cb328479063 (Wikidata) | unverified | one list mention |
| L'Événement | cb32771670c (1872 series) / cb34448379g (1865 series) (Wikidata) | unverified | 1881–84 mentions; pick the right series |
| La Justice (Clemenceau) | cb32802914p (Wikidata) | unverified | 097.0341 (2 Jan 1883) |
| Revue des Deux Mondes | cb32858360p (Wikidata) | unverified | 15 Oct 1883 issue: also on Wikisource / Gallica |
| Le Journal amusant | cb32779431v? (from a fr.wikipedia page, unchecked) | unverified | caricature of Marie, 092.0103 |
| Figaro illustré | not found (a separate Gallica title, monthly, 1883–1911) | to search | her drawing, autumn 1884 (105–106) |
| Le Petit Journal, Le Siècle, La Liberté, L'Univers, La Gazette des tribunaux, Le Charivari, L'Ordre, Paris-Journal | cb32895690j, cb32868136g, cb328066829, cb32885433z, cb34447990d, cb34452332k, cb32829748j, cb32832578f (Wikidata) | unverified | only generic mentions, no link planned |

## Not on Gallica (name the library only)

- **Galignani's Messenger** (Paris, English-language daily, 1814–1884; 20 diary mentions, 6 pasted clippings, 1873–75): no free digitised run found by web search; the BnF catalogue holds the title (catalogue.bnf.fr cb46868543h / cb46871692h came up). To check: Gallica itself, the British Newspaper Archive / Gale (both paid), Google Books and HathiTrust for volumes. Fallback: keep the print facsimile, no link.
- **The Morning Post, Daily News, The Times** (London): British Newspaper Archive (paid; Daily News and Morning Post) and The Times Digital Archive (paid). Only generic mentions except 025.0254 (Daily News, 16 Nov 1874).
- **Le Voltaire**: RetroNews (BnF, paid) — links to retronews.fr are possible but readers hit a paywall; mark them as such («accès payant»).
- **Russian papers** (unnamed «journal russe», 013.0125, 065.0506; the Russian illustrated weekly «Всемирная иллюстрация» for L'Illustration universelle, 102.0297): the Russian State Library (rusneb.ru / dlib.rsl.ru) and the Presidential Library (prlib.ru); Vsemirnaya Illyustratsiya is also on archive.org. Not for now.
- **Neapolitan paper** (070.0909), **Plaisance (Gers) dispatch** (083.0357), unidentified cuttings (067.1619): papers unidentified. Italian candidates would be the Biblioteca Nazionale di Napoli and the Emeroteca digitale of the Biblioteca Nazionale Braidense / "Biblioteca digitale Italiana"; not worth work unless the paper is identified.
- **Printed programmes** (069.0518, 070.0121, 070.0610, 071.0226 — Naples/Florence races and concerts): not newspapers; no source online.
- No Austrian paper occurs in the corpus, so ANNO (Austrian Newspapers Online) is not needed.
