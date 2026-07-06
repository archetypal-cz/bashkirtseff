// OBSOLETE (2026-07-06): unreferenced anywhere (no justfile recipe, no CI); superseded by
// a11y-audit.mjs from the same work session — candidate for removal.
import puppeteer from 'puppeteer-core';
import axePkg from 'axe-core';
const axeSource = axePkg.source;
import { readdirSync } from 'fs';
const base = '/home/krr/.cache/puppeteer/chrome';
const execPath = `${base}/${readdirSync(base)[0]}/chrome-linux64/chrome`;

const targets = [
  ['home light', 'http://localhost:4407/', 'light', null],
  ['home dark', 'http://localhost:4407/', 'dark', null],
  ['entry dark', 'http://localhost:4407/cz/106/1884-10-20', 'dark', null],
  ['home dark atelier', 'http://localhost:4407/', 'dark', 'atelier'],
  ['home dark deuil', 'http://localhost:4407/', 'dark', 'deuil'],
  ['home dark riviera', 'http://localhost:4407/', 'dark', 'riviera'],
  ['home light riviera', 'http://localhost:4407/', 'light', 'riviera'],
];
const browser = await puppeteer.launch({ executablePath: execPath, headless: 'new', args: ['--no-sandbox','--disable-gpu'] });
for (const [name, url, theme, brand] of targets) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument((t,b)=>{ localStorage.setItem('reading-theme', t); if(b) localStorage.setItem('reading-brand', b); }, theme, brand);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r=>setTimeout(r,1200));
    await page.evaluate(axeSource);
    const res = await page.evaluate(async()=>await window.axe.run(document,{runOnly:['color-contrast']}));
    const cc = res.violations.find(v=>v.id==='color-contrast');
    console.log(`\n### ${name}  (${cc?cc.nodes.length:0} contrast nodes)`);
    if(cc) for(const n of cc.nodes.slice(0,8)){
      const m = (n.any[0]&&n.any[0].data)||{};
      console.log(`  ${m.contrastRatio}:1  fg=${m.fgColor} bg=${m.bgColor}  fontSize=${m.fontSize}  ${n.target.join(' ').slice(0,70)}`);
    }
  } catch(e){ console.log(`### ${name} ERR ${e.message}`); }
  await page.close();
}
await browser.close();
