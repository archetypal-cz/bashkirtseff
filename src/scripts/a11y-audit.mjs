// A11y audit (WS-H/H1, docs/A11Y_PLAN.md) — axe-core over the key page types,
// across every theme × brand variant (3 × 4 = 12 combos by default). CI-ready:
// exits non-zero when serious/critical violations exceed the budget (default 0).
//
//   BASE_URL=http://localhost:4407 node src/scripts/a11y-audit.mjs
//   THEMES=light,dark BRANDS=default,deuil PAGES=entry-flipped node src/scripts/a11y-audit.mjs   (subset)
//   CHROME_PATH=/usr/bin/chromium node ...   (default: puppeteer cache)
//
// Also asserts (WS-D/D3) that no `%%` annotation markers leak into rendered
// body text on any scanned page.
import puppeteer from 'puppeteer-core';
import axePkg from 'axe-core';
import { readdirSync } from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:4407';
const THEMES = (process.env.THEMES || 'light,sepia,dark').split(',');
const BRANDS = (process.env.BRANDS || 'default,atelier,deuil,riviera').split(',');
const BUDGET = parseInt(process.env.A11Y_BUDGET || '0', 10);

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = `${process.env.HOME}/.cache/puppeteer/chrome`;
  const dir = readdirSync(base)[0];
  return `${base}/${dir}/chrome-linux64/chrome`;
}

const PAGES = {
  'home': '/',
  'year-overview': '/cz/',
  'carnet-year': '/cz/1873/',
  'carnet-entries': '/cz/105/',
  'entry-cz': '/cz/105/1884-07-02/',
  'entry-uk': '/uk/106/1884-10-20/',
  // Same entry with its first paragraphs flipped to the French original, so
  // the back face (the "slip": text-secondary italic on bg-secondary) and its
  // footnote markers are audited in every theme × brand.
  'entry-flipped': '/cz/001/1873-01-11/',
  'glossary-index': '/cz/glossary/',
  'about': '/cz/about/',
};

// PAGES=entry-flipped,glossary-index audits a subset (e.g. against a slow dev server).
const ONLY = process.env.PAGES ? process.env.PAGES.split(',') : null;
if (ONLY) for (const k of Object.keys(PAGES)) if (!ONLY.includes(k)) delete PAGES[k];

// Flip up to three paragraphs that carry an original; returns how many flipped.
async function flipParagraphs(page) {
  const n = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.toolbar__btn--fleur')].slice(0, 3);
    btns.forEach(b => b.click());
    return btns.length;
  });
  await new Promise(r => setTimeout(r, 900)); // the 0.6s rotateY transition
  return n;
}

const axeSource = axePkg.source;
const browser = await puppeteer.launch({
  executablePath: chromePath(),
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

let seriousTotal = 0;
let markerLeaks = 0;

for (const theme of THEMES) {
  for (const brand of BRANDS) {
    for (const [name, path] of Object.entries(PAGES)) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      try {
        await page.evaluateOnNewDocument((t, b) => {
          localStorage.setItem('reading-theme', t);
          if (b && b !== 'default') localStorage.setItem('reading-brand', b);
          else localStorage.removeItem('reading-brand');
        }, theme, brand);
        await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 1500)); // let islands hydrate
        // The PWA install prompt only appears when Chrome happens to fire
        // beforeinstallprompt, which made the gate flaky. Fire it ourselves so
        // the prompt is always present and always audited.
        await page.evaluate(() => {
          const e = new Event('beforeinstallprompt', { cancelable: true });
          e.prompt = () => {};
          e.userChoice = Promise.resolve({ outcome: 'dismissed' });
          window.dispatchEvent(e);
        });
        await new Promise(r => setTimeout(r, 300));

        if (name === 'entry-flipped' && (await flipParagraphs(page)) === 0) {
          throw new Error('no flippable paragraph (toolbar not hydrated?)');
        }

        // WS-D/D3: %% annotation markers must never reach rendered text
        const leaks = await page.evaluate(() =>
          (document.querySelector('main')?.innerText.match(/%%/g) || []).length);
        if (leaks > 0) {
          markerLeaks += leaks;
          console.log(`✗ ${name} [${theme}/${brand}] — ${leaks} '%%' markers leaked into rendered text`);
        }

        await page.evaluate(axeSource);
        const results = await page.evaluate(() => axe.run({
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        }));
        const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
        seriousTotal += serious.reduce((n, v) => n + v.nodes.length, 0);
        const desc = serious.map(v => `${v.id}(${v.nodes.length})`).join(', ');
        console.log(`${serious.length ? '✗' : '✓'} ${name} [${theme}/${brand}] ${desc || 'clean'}`);
        if (serious.length && process.env.VERBOSE) {
          for (const v of serious) console.log(`    ${v.id}: ${v.nodes[0]?.target?.join(' ')}`);
        }
      } catch (e) {
        console.log(`! ${name} [${theme}/${brand}] ERROR ${e.message.slice(0, 100)}`);
        seriousTotal += 1000; // page failure fails the gate
      }
      await page.close();
    }
  }
}

await browser.close();
console.log(`\nserious/critical nodes: ${seriousTotal} (budget ${BUDGET}) · %% leaks: ${markerLeaks}`);
if (seriousTotal > BUDGET || markerLeaks > 0) {
  console.log('A11Y GATE: FAIL');
  process.exit(1);
}
console.log('A11Y GATE: PASS');
