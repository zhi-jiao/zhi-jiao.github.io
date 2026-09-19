'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const run = promisify(execFile);

const profileUrl = 'https://scholar.google.com/citations?user=Sa9e9icAAAAJ&hl=en';
const output = path.join(__dirname, 'homepage', '_data', 'scholar.yml');

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/<[^>]+>/g, '').trim();
}

function parsePublications(html) {
  if (!html.includes('Google Scholar') || html.includes('g-recaptcha')) throw new Error('Scholar returned a challenge page');
  return [...html.matchAll(/<tr class="gsc_a_tr"[\s\S]*?<\/tr>/g)].map(row => {
    const block = row[0];
    const title = decode(block.match(/class="gsc_a_at"[^>]*>([\s\S]*?)<\/a>/)?.[1] || '');
    const meta = decode(block.match(/class="gs_gray">([\s\S]*?)<\/div>/)?.[1] || '');
    const detail = decode(block.match(/class="gs_gray">[\s\S]*?<div class="gs_gray">([\s\S]*?)<\/div>/)?.[1] || '');
    const year = block.match(/class="gsc_a_h gsc_a_hc gs_ibl">(\d{4})<\//)?.[1];
    return title ? { title, authors: meta.split(',').map(v => v.trim()).filter(Boolean), venue: detail || 'Google Scholar', ...(year ? { year: Number(year) } : {}) } : null;
  }).filter(Boolean);
}

(async () => {
  try {
    // Windows PowerShell follows the user's configured proxy more reliably
    // than Node's HTTPS stack in some campus networks.
    const { stdout: html } = await run('powershell.exe', ['-NoProfile', '-Command', `$ProgressPreference='SilentlyContinue'; (Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 -Uri '${profileUrl}').Content`], { maxBuffer: 8 * 1024 * 1024, timeout: 30000 });
    const publications = parsePublications(html);
    if (!publications.length) throw new Error('No publications found');
    await fs.writeFile(output, `# Generated from Google Scholar. Do not edit manually.\npublications:\n${publications.map(p => `  - title: ${JSON.stringify(p.title)}\n    authors: ${JSON.stringify(p.authors)}\n    venue: ${JSON.stringify(p.venue)}${p.year ? `\n    year: ${p.year}` : ''}`).join('\n')}\n`, 'utf8');
    console.log(`Google Scholar: synced ${publications.length} publications.`);
  } catch (error) {
    console.warn(`Google Scholar sync skipped: ${error.message}`);
  }
})();
