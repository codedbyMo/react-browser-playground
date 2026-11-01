// @vitest-environment node
import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';
import TimeZoneBadge from '../src/components/TimeZoneBadge';
import { renderToHtml } from '../src/server/renderApp';

describe('conditional use(browser())', () => {
  it('renders the server default into the HTML and never bails out', async () => {
    const { html, bailouts } = await renderToHtml(
      <Suspense fallback={<p>Loading time zone...</p>}>
        <TimeZoneBadge defaultValue="America/Toronto" />
      </Suspense>,
    );

    // React separates the interpolated value with a comment node.
    expect(html.replace(/<!--[\s\S]*?-->/g, '')).toContain(
      'Time zone: America/Toronto',
    );
    expect(html).not.toContain('Loading time zone...');
    expect(bailouts).toEqual([]);
  });

  it('bails out to the fallback when no default is provided', async () => {
    const { html, bailouts } = await renderToHtml(
      <Suspense fallback={<p>Loading time zone...</p>}>
        <TimeZoneBadge />
      </Suspense>,
    );

    expect(html).toContain('Loading time zone...');
    expect(html).not.toContain('Time zone:');
    expect(bailouts).toHaveLength(1);
    expect(bailouts[0]?.cause).toBe(
      'useTimeZone has no server default and reads the device time zone.',
    );
  });
});
