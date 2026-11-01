import { useEffect, useState } from 'react';

// The two patterns browser() replaces, kept for comparison.

// Pattern 1: the mounted gate. The first render (server AND the
// client's hydration render) shows the fallback, then an effect
// flips the flag and the component renders a second time. It works,
// but the fallback flashes even for users whose browser could have
// rendered the content immediately, and every browser-only subtree
// pays for the extra render.
export function MountedDraft() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <p>Loading saved draft...</p>;
  }

  return <p>{localStorage.getItem('draft') ?? 'No draft saved yet.'}</p>;
}

// Pattern 2: the typeof window check. During server rendering it
// returns the fallback, but the client's first render sees window
// and returns the real content, which does not match the server
// HTML. React then has to recover from a hydration mismatch
// instead of following an agreed plan.
export function TypeofWindowBadge() {
  if (typeof window === 'undefined') {
    return <p>Loading viewport...</p>;
  }

  return <p>Viewport width: {window.innerWidth}px</p>;
}
