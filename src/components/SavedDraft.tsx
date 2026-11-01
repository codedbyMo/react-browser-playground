import { use, useState } from 'react';
import { browser } from 'react-dom';

// This component cannot produce meaningful HTML on the server:
// the draft lives in localStorage, which only exists in the browser.
// use(browser(...)) opts the component out of server rendering.
// On the server it suspends and the nearest <Suspense> fallback is
// sent in the HTML. In the browser it returns undefined and the
// component renders normally.
export default function SavedDraft() {
  use(browser('SavedDraft reads the draft from localStorage.'));

  const [draft] = useState(() => localStorage.getItem('draft') ?? '');

  return (
    <section>
      <h2>Your saved draft</h2>
      {draft ? <p>{draft}</p> : <p>No draft saved yet.</p>}
    </section>
  );
}
