// Jordan in Numbers — a national statistics site for Jordan, as static files
// under app/ (index.html, CSS, ES modules and the figures in data.js; no
// build step, no network). This program hands the entry in: it copies app/
// and screenshots/ from beside this file into the output directory and
// writes /output/dossier.json with the vendored make.fun library, which is
// the summary the judge reads (screenshots, first-load files and bytes, and
// the site's source). Leave vendor/makefun-frontend.ts untouched: the scorer
// rebuilds the dossier with its own copy and requires a byte-for-byte match.
//
// Run locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly instead of handing in an empty site: the entry point must exist.
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing — nothing to hand in');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 16 MiB of
// app files: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);

// A short, deterministic summary on stdout: the same input always prints
// the same lines, so two runs can be compared byte for byte.
const shotNames = readdirSync(join(out, 'screenshots')).sort();
const shotBytes = shotNames.reduce((sum, name) => sum + statSync(join(out, 'screenshots', name)).size, 0);
console.log(`jordan-in-numbers: app/index.html=${statSync(join(out, 'app', 'index.html')).size} bytes`);
console.log(`jordan-in-numbers: screenshots=${shotNames.length} files, ${shotBytes} bytes`);
console.log(`jordan-in-numbers: dossier.json=${statSync(join(out, 'dossier.json')).size} bytes`);
