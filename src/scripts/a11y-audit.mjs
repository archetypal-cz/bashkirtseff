// A11y audit (WS-H/H1, docs/A11Y_PLAN.md) — axe-core over the key page types,
// optionally across themes and brand variants. CI-ready: exits non-zero when
// serious/critical violations exceed the budget (default 0).
//
//   BASE_URL=http://localhost:4407 node src/scripts/a11y-audit.mjs
//   THEMES=light,dark BRANDS=default,atelier,deuil,riviera node src/scripts/a11y-audit.mjs
//   CHROME_PATH=/usr/bin/chromium node ...   (default: puppeteer cache)
//
// Also asserts (WS-D/D3) that no `%%` annotation markers leak into rendered
// body text on any scanned page.
import puppeteer from 'puppeteer-core';
import axePkg from 'axe-core';
import { readdirSync } from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:4407';
const THEMES = (process.env.THEMES || 'light').split(',');
const BRANDS = (process.env.BRANDS || 'default').split(',');
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
  'entry-cz': '/cz/105/1884-07-02',
  'entry-uk': '/uk/106/1884-10-20',
  'glossary-index': '/cz/glossary/',
  'about': '/cz/about',
};

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
