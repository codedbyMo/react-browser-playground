import { Writable } from 'node:stream';
import type { ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';

export interface BailoutRecord {
  message: string;
  cause: unknown;
  componentStack: string;
}

export interface RenderResult {
  html: string;
  bailouts: BailoutRecord[];
  errors: unknown[];
  shellError: unknown;
}

// Renders a tree to HTML the way a Node server would, recording
// every onBrowserBailout report and every error React surfaces.
export function renderToHtml(node: ReactNode): Promise<RenderResult> {
  return new Promise((resolve) => {
    const bailouts: BailoutRecord[] = [];
    const errors: unknown[] = [];
    let shellError: unknown = null;
    let html = '';
    let settled = false;

    const sink = new Writable({
      write(chunk, _encoding, callback) {
        html += chunk.toString();
        callback();
      },
    });

    const settle = () => {
      if (!settled) {
        settled = true;
        resolve({ html, bailouts, errors, shellError });
      }
    };
    sink.on('finish', settle);
    sink.on('error', settle);

    const { pipe } = renderToPipeableStream(node, {
      onBrowserBailout(error, errorInfo) {
        const asError = error as { message?: unknown; cause?: unknown };
        bailouts.push({
          message:
            typeof asError?.message === 'string'
              ? asError.message
              : String(error),
          cause: asError?.cause,
          componentStack: errorInfo.componentStack ?? '',
        });
      },
      onError(error) {
        errors.push(error);
      },
      onShellError(error) {
        shellError = error;
      },
      onAllReady() {
        // The stream may still be flushing into the sink; the
        // sink's finish event settles the promise.
      },
    });

    pipe(sink);
  });
}
