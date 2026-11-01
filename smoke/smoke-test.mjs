// Real-browser hydration smoke test for the browser() playground.
//
// What it proves, end to end, against the pinned react-dom 19.3.1:
// 1. The streamed server HTML contains the Suspense fallbacks and
//    the client-rendering template marker, and none of the
//    browser-only content.
// 2. A real Chromium loads that page, hydrates it with
//    hydrateRoot, and the browser-only content appears in place of
//    the fallbacks.
// 3. The browser reports no console errors, no page errors, and no
//    hydration mismatch warnings while doing so.
//
// Evidence written next to this script: initial.html (raw server
// response), final.html (DOM after hydration), output.txt (this
// script's report). Run with: npm run smoke
import { createServer } from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { renderPageHtml } from './dist/server.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// Browser resolution order: explicit CHROME_PATH, then the
// standalone chrome-headless-shell downloaded into smoke/browsers
// (the system Chromium in this environment is a policy-managed
// build that refuses unattended launches), then that system build.
async function resolveChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = path.join(here, 'browsers', 'chrome-headless-shell');
  try {
    for (const version of await readdir(base)) {
      const candidate = path.join(
        base,
        version,
        'chrome-headless-shell-linux64',
        'chrome-headless-shell',
      );
      if (existsSync(candidate)) return candidate;
    }
  } catch {
    // No downloaded browser; fall through to the system build.
  }
  return '/opt/meta-chromium/chrome';
}
const CHROME = await resolveChrome();
const SEEDED_DRAFT = 'Smoke test draft body.';

const lines = [];
const checks = [];
function log(line) {
  lines.push(line);
  console.log(line);
}
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
}

let browser;
let server;

try {
  log('browser() smoke test: react-dom 19.3.1, real Chromium');
  log(`chromium executable: ${CHROME}`);

  // 1. Render the page exactly as a Node server would.
  const rendered = await renderPageHtml();
  log(
    `server render: bailouts=${rendered.bailoutCount} ` +
      `causes=${JSON.stringify(rendered.bailoutCauses)} ` +
      `errors=${rendered.errorCount} shellError=${rendered.shellError}`,
  );

  const clientJs = await readFile(path.join(here, 'dist', 'client.js'), 'utf8');
  const pageHtml =
    '<!doctype html>\n<html><head><meta charset="utf-8">' +
    '<title>browser() smoke test</title></head><body>' +
    `<div id="root">${rendered.html}</div>` +
    '<script type="module" src="/client.js"></script>' +
    '</body></html>';

  server = createServer((req, res) => {
    if (req.url === '/client.js') {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      res.end(clientJs);
    } else {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(pageHtml);
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  log(`serving at ${base}`);

  // 2. Raw response assertions: what a browser receives first.
  const raw = await (await fetch(base)).text();
  await writeFile(path.join(here, 'initial.html'), raw);
  check('initial HTML has the saved-draft fallback', raw.includes('Loading saved draft...'));
  check('initial HTML has the viewport fallback', raw.includes('Loading viewport...'));
  check(
    'initial HTML has the client-rendering template marker',
    raw.includes('Switched to client rendering because a component requested it.'),
  );
  check('initial HTML has no browser-only draft content', !raw.includes(SEEDED_DRAFT));
  check('initial HTML has no rendered viewport width', !raw.includes('Viewport width:'));

  // 3. Real browser run.
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  log(`browser version: ${await browser.version()}`);
  const page = await browser.newPage();

  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err));
  });

  // Seed the draft before any page script runs, so SavedDraft has
  // something only the browser can read.
  await page.evaluateOnNewDocument((value) => {
    try {
      localStorage.setItem('draft', value);
    } catch {
      // If storage is unavailable the assertions below will say so.
    }
  }, SEEDED_DRAFT);

  await page.goto(base, { waitUntil: 'load', timeout: 30000 });

  let hydrated = true;
  try {
    await page.waitForFunction(
      (expected) => {
        const text = document.body ? document.body.innerText : '';
        return (
          text.includes(expected) && /Viewport width: \d+px/.test(text)
        );
      },
      { timeout: 15000 },
      SEEDED_DRAFT,
    );
  } catch {
    hydrated = false;
  }

  const finalText = await page.evaluate(() => document.body.innerText);
  const finalHtml = await page.evaluate(() => document.documentElement.outerHTML);
  await writeFile(path.join(here, 'final.html'), finalHtml);

  check('hydration completed: browser-only content appeared', hydrated);
  check('seeded draft text rendered after hydration', finalText.includes(SEEDED_DRAFT));
  check(
    'viewport width rendered after hydration',
    /Viewport width: \d+px/.test(finalText),
  );
  check(
    'fallbacks replaced after hydration',
    !finalText.includes('Loading saved draft...') &&
      !finalText.includes('Loading viewport...'),
  );

  for (const m of consoleMessages) {
    log(`console[${m.type}] ${m.text}`);
  }
  for (const e of pageErrors) {
    log(`pageerror ${e}`);
  }
  const consoleErrors = consoleMessages.filter((m) => m.type === 'error');
  const hydrationWarnings = consoleMessages.filter((m) =>
    /hydrat|did not match|mismatch/i.test(m.text),
  );
  check('no console errors', consoleErrors.length === 0, `${consoleErrors.length} found`);
  check(
    'no hydration mismatch warnings',
    hydrationWarnings.length === 0,
    `${hydrationWarnings.length} found`,
  );
  check('no page errors', pageErrors.length === 0, `${pageErrors.length} found`);
} catch (err) {
  log(`SMOKE TEST ERROR: ${err && err.stack ? err.stack : err}`);
  checks.push({ name: 'smoke test ran to completion', ok: false });
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await new Promise((resolve) => server.close(resolve));
  const failed = checks.filter((c) => !c.ok);
  log(
    failed.length === 0
      ? `RESULT: PASS (${checks.length}/${checks.length} checks)`
      : `RESULT: FAIL (${checks.length - failed.length}/${checks.length} checks passed)`,
  );
  await writeFile(path.join(here, 'output.txt'), lines.join('\n') + '\n');
  process.exit(failed.length === 0 ? 0 : 1);
}
