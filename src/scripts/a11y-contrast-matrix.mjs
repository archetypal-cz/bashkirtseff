// A11y contrast matrix (WS-A, docs/A11Y_PLAN.md) — verifies the key token pairs
// across all 12 theme×brand combos. KEEP THE VALUES IN SYNC with
// src/frontend/src/styles/branding.css (they are duplicated here deliberately so
// palette edits fail loudly). Run: node src/scripts/a11y-contrast-matrix.mjs
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = hex => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const W = '#FFFFFF';

// PROPOSED palettes: { bg1, bg2, accent (text), accentHover (text), fill, fillHover, muted }
const combos = {
  'default light':  { bg1:'#FFF8F0', bg2:'#F5E6D3', acc:'#9A4707', accH:'#92400E', fill:'#9A4707', fillH:'#92400E', muted:'#5C5650' },
  'default sepia':  { bg1:'#F5E6D3', bg2:'#EBD9C4', acc:'#9A4707', accH:'#92400E', fill:'#9A4707', fillH:'#92400E', muted:'#5C5650' },
  'default dark':   { bg1:'#171310', bg2:'#211B16', acc:'#E08E2B', accH:'#F0A952', fill:'#B45309', fillH:'#92400E', muted:'#A89B89' },
  'atelier light':  { bg1:'#EEF1F4', bg2:'#DCE3EA', acc:'#1F5C82', accH:'#164156', fill:'#1F5C82', fillH:'#164156', muted:'#4C5A66' },
  'atelier sepia':  { bg1:'#DCE3EA', bg2:'#CBD5DE', acc:'#1F5C82', accH:'#164156', fill:'#1F5C82', fillH:'#164156', muted:'#4C5A66' },
  'atelier dark':   { bg1:'#12181E', bg2:'#1B242D', acc:'#6FB3D9', accH:'#93C8E5', fill:'#2E7BA8', fillH:'#1F5C82', muted:'#8B98A5' },
  'deuil light':    { bg1:'#F4F1EA', bg2:'#E7E2D6', acc:'#7A2E2E', accH:'#5C2020', fill:'#7A2E2E', fillH:'#5C2020', muted:'#5D564E' },
  'deuil sepia':    { bg1:'#E7E2D6', bg2:'#D8D1C2', acc:'#7A2E2E', accH:'#5C2020', fill:'#7A2E2E', fillH:'#5C2020', muted:'#5D564E' },
  'deuil dark':     { bg1:'#141210', bg2:'#1E1A17', acc:'#C56B6B', accH:'#D68A8A', fill:'#A84545', fillH:'#7A2E2E', muted:'#948B7E' },
  'riviera light':  { bg1:'#FFFDF8', bg2:'#E9F0EE', acc:'#0B6A73', accH:'#0A5960', fill:'#0B6A73', fillH:'#0A5960', muted:'#5F5C56' },
  'riviera sepia':  { bg1:'#E9F0EE', bg2:'#D8E4E1', acc:'#0B6A73', accH:'#0A5960', fill:'#0B6A73', fillH:'#0A5960', muted:'#5F5C56' },
  'riviera dark':   { bg1:'#0F1B1A', bg2:'#172726', acc:'#38C0C9', accH:'#66D3DA', fill:'#108088', fillH:'#0B6A73', muted:'#8C9791' },
};

let fails = 0;
const rows = [];
for (const [name, c] of Object.entries(combos)) {
  const checks = [
    ['accent/bg1', ratio(c.acc, c.bg1), 4.5],
    ['accent/bg2', ratio(c.acc, c.bg2), 4.5],
    ['accentHover/bg1', ratio(c.accH, c.bg1), 4.5],
    ['accentHover/bg2', ratio(c.accH, c.bg2), 4.5],
    ['white/fill', ratio(W, c.fill), 4.5],
    ['white/fillHover', ratio(W, c.fillH), 4.5],
    ['muted/bg1', ratio(c.muted, c.bg1), 4.5],
    ['muted/bg2', ratio(c.muted, c.bg2), 4.5],
    ['fill-vs-bg1 (non-text)', ratio(c.fill, c.bg1), 3.0],
  ];
  const bad = checks.filter(([, r, min]) => r < min);
  fails += bad.length;
  rows.push(`${name}: ` + checks.map(([k, r, min]) => `${k}=${r.toFixed(2)}${r < min ? ' ✗' : ''}`).join('  '));
}
console.log(rows.join('\n'));
console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`);
