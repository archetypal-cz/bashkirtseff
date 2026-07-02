import puppeteer from 'puppeteer-core';
import axePkg from 'axe-core';
const axeSource = axePkg.source;
import { readdirSync } from 'fs';

// find chrome
const base = '/home/krr/.cache/puppeteer/chrome';
const dir = readdirSync(base)[0];
const execPath = `${base}/${dir}/chrome-linux64/chrome`;

const pages = {
  'year-overview /cz/': 'http://localhost:4407/cz/',
  'carnet-year /cz/1873/': 'http://localhost:4407/cz/1873/',
  'carnet-entries /cz/001/': 'http://localhost:4407/cz/001/',
  'entry /cz/106/1884-10-20': 'http://localhost:4407/cz/106/1884-10-20',
  'entry-uk /uk/106/1884-10-20': 'http://localhost:4407/uk/106/1884-10-20',
  'glossary-index /cz/glossary/': 'http://localhost:4407/cz/glossary/',
  'home /cz/index? /': 'http://localhost:4407/',
  'about /cz/about': 'http://localhost:4407/cz/about',
};

const browser = await puppeteer.launch({ executablePath: execPath, headless: 'new', args: ['--no-sandbox','--disable-gpu'] });
const themes = process.env.THEMES ? process.env.THEMES.split(',') : ['light'];

for (const [name, url] of Object.entries(pages)) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    // let islands hydrate
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(axeSource);
    const results = await page.evaluate(async () => {
      return await window.axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'] });
    });
    const v = results.violations;
    const count = v.reduce((s,x)=>s+x.nodes.length,0);
    console.log(`\n### ${name}  — ${v.length} rule violations, ${count} nodes`);
    for (const rule of v.sort((a,b)=>({critical:0,serious:1,moderate:2,minor:3}[a.impact]-{critical:0,serious:1,moderate:2,minor:3}[b.impact]))) {
      const sample = rule.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' | ');
      console.log(`  [${rule.impact}] ${rule.id} (${rule.nodes.length}) — ${rule.help}`);
      console.log(`      e.g. ${sample}`);
    }
  } catch (e) {
    console.log(`\n### ${name} — ERROR ${e.message}`);
  }
  await page.close();
}
await browser.close();
