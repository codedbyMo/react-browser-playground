import App from '../src/App';
import { renderToHtml } from '../src/server/renderApp';

// Server entry for the smoke test: renders the same App the draft
// walks through, through the playground's own recorded render
// helper, and returns the streamed HTML plus the bailout and error
// records so the smoke script can assert on all three.
export async function renderPageHtml() {
  const result = await renderToHtml(<App />);
  return {
    html: result.html,
    bailoutCount: result.bailouts.length,
    bailoutCauses: result.bailouts.map((b) => b.cause),
    errorCount: result.errors.length,
    shellError: result.shellError ? String(result.shellError) : null,
  };
}
