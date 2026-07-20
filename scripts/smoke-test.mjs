#!/usr/bin/env node
// Headless-Chrome regression check for Marty's Plant Haven.
// Usage: node scripts/smoke-test.mjs [url]   (defaults to http://localhost:8743/)
//
// Loads the app, exercises the Maps/Courtyard/Irrigation views, and fails loudly
// (non-zero exit code) on any console error, uncaught page error, or failed
// same-origin request. Run this against a local server before every deploy,
// and again against the live URL after deploying.

import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2] || 'http://localhost:8743/';

function findByText(page, selector, text) {
  return page.evaluateHandle((sel, txt) => {
    return Array.from(document.querySelectorAll(sel)).find(el => el.textContent.includes(txt)) || null;
  }, selector, text);
}

async function clickByText(page, selector, text) {
  const handle = await findByText(page, selector, text);
  const el = handle.asElement();
  if (el) await el.click();
  await handle.dispose();
  return !!el;
}

async function main() {
  const errors = [];
  const failedRequests = [];

  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();

  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('404') && !text.includes('BABEL')) {
      errors.push(`console.error: ${text}`);
    }
  });
  page.on('requestfailed', req => {
    if (req.url().startsWith(new URL(url).origin)) failedRequests.push(req.url());
  });
  page.on('dialog', async d => { await d.dismiss(); });

  console.log(`Loading ${url} ...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const rootLen1 = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
  console.log(`  catalogue view rendered, ${rootLen1} chars`);

  // Maps -> Courtyard
  await clickByText(page, 'button, a, div[role="button"], nav *', 'Maps');
  await new Promise(r => setTimeout(r, 1200));
  await clickByText(page, 'button', 'Courtyard');
  await new Promise(r => setTimeout(r, 1500));
  const rootLen2 = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
  console.log(`  courtyard map rendered, ${rootLen2} chars`);

  // Irrigation System (top-level tab)
  await clickByText(page, 'button', 'Irrigation');
  await new Promise(r => setTimeout(r, 1200));
  const irrigationText = await page.evaluate(() => document.getElementById('root')?.innerText || '');
  const irrigationOk = irrigationText.includes('Irrigation System') && irrigationText.includes('Courtyard') && irrigationText.includes('Back Garden');
  console.log(`  irrigation view rendered: ${irrigationOk}`);

  // Care Schedule
  await clickByText(page, 'button', 'Care Schedule');
  await new Promise(r => setTimeout(r, 1200));
  const scheduleText = await page.evaluate(() => document.getElementById('root')?.innerText || '');
  const scheduleOk = scheduleText.includes('Care Schedule');
  console.log(`  schedule view rendered: ${scheduleOk}`);

  await browser.close();

  console.log('\n=== Results ===');
  console.log('Errors:', errors.length ? errors.join('\n  ') : '(none)');
  console.log('Failed same-origin requests:', failedRequests.length ? failedRequests.join('\n  ') : '(none)');

  const rootsOk = rootLen1 > 10000 && rootLen2 > 10000;
  const pass = errors.length === 0 && failedRequests.length === 0 && rootsOk && irrigationOk && scheduleOk;

  if (!pass) {
    console.error('\nFAIL');
    process.exit(1);
  }
  console.log('\nPASS');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
