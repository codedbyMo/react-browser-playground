import { use } from 'react';
import { browser } from 'react-dom';

// window.innerWidth has no server value. Instead of guarding the
// read with typeof window, the component declares itself
// browser-only and reads the value directly.
export default function ViewportBadge() {
  use(browser('ViewportBadge reads window.innerWidth.'));

  return <p>Viewport width: {window.innerWidth}px</p>;
}
