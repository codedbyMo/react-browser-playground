import { Suspense } from 'react';
import SavedDraft from './components/SavedDraft';
import ViewportBadge from './components/ViewportBadge';

export default function App() {
  return (
    <main>
      <h1>Post settings</h1>
      <p>This intro renders on the server.</p>
      <Suspense fallback={<p>Loading saved draft...</p>}>
        <SavedDraft />
      </Suspense>
      <Suspense fallback={<p>Loading viewport...</p>}>
        <ViewportBadge />
      </Suspense>
    </main>
  );
}
