#!/usr/bin/env node
// Runs after `vite build`. Stamps dist/sw.js's cache name with a hash derived
// from the built output, so every build that changes app code automatically
// busts old service-worker caches — no more hand-incrementing plant-haven-vNN.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const dist = path.resolve(import.meta.dirname, '..', 'dist');

function collectFiles(dir) {
  let out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(collectFiles(p));
    else out.push(p);
  }
  return out;
}

const hash = createHash('sha256');
for (const file of collectFiles(dist)) {
  if (file.endsWith(path.join('dist', 'sw.js'))) continue;
  hash.update(readFileSync(file));
}
const version = hash.digest('hex').slice(0, 10);

const swPath = path.join(dist, 'sw.js');
const sw = readFileSync(swPath, 'utf8').replace('__CACHE_VERSION__', version);
writeFileSync(swPath, sw);

console.log(`sw.js cache version stamped: plant-haven-${version}`);
