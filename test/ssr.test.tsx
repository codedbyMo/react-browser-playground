// @vitest-environment node
import { describe, expect, it } from 'vitest';
import App from '../src/App';
import SavedDraft from '../src/components/SavedDraft';
import { renderToHtml } from '../src/server/renderApp';

describe('server rendering with use(browser())', () => {
  it('sends the Suspense fallbacks in the HTML, not the browser-only content', async () => {
    const { html } = await renderToHtml(<App />);

    expect(html).toContain('This intro renders on the server.');
    expect(html).toContain('Loading saved draft...');
    expect(html).toContain('Loading viewport...');
    expect(html).not.toContain('Your saved draft');
    expect(html).not.toContain('Viewport width:');
  });

  it('reports each bailout through onBrowserBailout with the reason as the cause', async () => {
    const { bailouts, errors } = await renderToHtml(<App />);

    expect(errors).toEqual([]);
    expect(bailouts).toHaveLength(2);

    const draftBailout = bailouts.find(
      (b) => b.cause === 'SavedDraft reads the draft from localStorage.',
    );
    expect(draftBailout).toBeDefined();
    expect(draftBailout?.componentStack).toContain('SavedDraft');

    const viewportBailout = bailouts.find(
      (b) => b.cause === 'ViewportBadge reads window.innerWidth.',
    );
    expect(viewportBailout).toBeDefined();
    expect(viewportBailout?.componentStack).toContain('ViewportBadge');
  });

  it('fails the render instead of calling onBrowserBailout when no Suspense boundary wraps the component', async () => {
    const { bailouts, errors, shellError } = await renderToHtml(<SavedDraft />);

    expect(bailouts).toEqual([]);
    expect(shellError !== null || errors.length > 0).toBe(true);
  });
});
