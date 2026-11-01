# react-browser-25 playground

Companion code for blog post #25, "Stop Reaching for typeof window:
React 19.3's browser() API".

## Pinned versions

- react 19.3.1 and react-dom 19.3.1 (npm `latest` on Oct 31, 2026)
- @types/react and @types/react-dom 19.3.0
- typescript 5.9.3, vitest 5.0.5, jsdom 30.1.3
- Node v24.22.1

## Run it

```bash
npm install
npm run check-exports   # proves the installed react-dom exports browser()
npm run typecheck       # tsc --noEmit, strict
npm test                # vitest run, 7 tests
npm run smoke           # real-browser hydration smoke test (see smoke/)
```

## What is here

- `src/components/SavedDraft.tsx` and `src/components/ViewportBadge.tsx`:
  browser-only components using `use(browser(reason))`.
- `src/components/TimeZoneBadge.tsx`: the conditional form. With a
  server-supplied default the component renders on the server; without
  one it bails out.
- `src/legacy/legacy-patterns.tsx`: the mounted gate and the
  `typeof window` check that `browser()` replaces.
- `src/App.tsx`: the page, with a `<Suspense>` boundary per
  browser-only subtree.
- `src/server/renderApp.tsx`: `renderToPipeableStream` with an
  `onBrowserBailout` recorder, used by the server tests.

## What the tests prove

- Server HTML contains the Suspense fallbacks and the ordinary
  server-rendered content, and none of the browser-only content.
- `onBrowserBailout` fires once per bailed boundary with the reason
  string as `error.cause` and a component stack naming the component;
  `onError` never fires.
- Without a `<Suspense>` boundary the server render fails through the
  ordinary error channels and `onBrowserBailout` is not called.
- In jsdom, the browser-only subtrees render their real content
  (localStorage seeded by the test) with no mounted gate.
- The mounted gate's server output is the fallback alone; its content
  appears on the client only after an effect runs.
- In a real Chromium (the `smoke/` test, Nov 1, 2026): the streamed
  page hydrates with `hydrateRoot`, the fallbacks are replaced by
  the browser-only content (seeded localStorage draft, live viewport
  width), and the browser reports no console errors, no page errors,
  and no hydration mismatch warnings. 12 of 12 checks passed;
  evidence in `smoke/output.txt`, `smoke/initial.html`, and
  `smoke/final.html`.

## What was not exercised

- React Server Components and the `'use client'` requirement (no
  Flight runtime here). That requirement is documented behaviour.
- The `abort(browser())` timeout path (documented, not run).
- Reason-as-function laziness (documented and typed; the components
  here use string reasons).
