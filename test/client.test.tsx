// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { MountedDraft } from '../src/legacy/legacy-patterns';

let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  localStorage.setItem('draft', 'Ship the browser() post on Friday.');
});

afterEach(() => {
  container.remove();
  localStorage.clear();
});

describe('client rendering', () => {
  it('renders the browser-only subtrees without a mounted gate', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('Ship the browser() post on Friday.');
    expect(container.textContent).toContain('Viewport width:');
    expect(container.textContent).not.toContain('Loading saved draft...');

    await act(async () => {
      root.unmount();
    });
  });

  it('shows the legacy mounted gate renders the fallback first and the content only after an effect', async () => {
    // Server render (and the hydration render, which must match
    // it): the gate is closed, so only the fallback exists.
    const serverHtml = renderToString(<MountedDraft />);
    expect(serverHtml).toContain('Loading saved draft...');
    expect(serverHtml).not.toContain('Ship the browser() post on Friday.');

    // On the client the content appears, but only because an
    // effect flipped the gate and triggered a second render.
    const root = createRoot(container);
    await act(async () => {
      root.render(<MountedDraft />);
    });
    expect(container.textContent).toContain('Ship the browser() post on Friday.');

    await act(async () => {
      root.unmount();
    });
  });
});
