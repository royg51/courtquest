'use client';

import { useEffect } from 'react';

// Next.js code-splits every route into its own JS chunk. A chunk reference
// already loaded in the browser can go stale relative to the server for
// reasons outside app code's control — most commonly in dev, where the
// on-demand-entries compiler garbage-collects idle routes (default: after
// 60s, or once more than 5 other routes have been visited) and recompiles
// them with new internal module ids on next visit; in production, the same
// thing happens if a new deploy replaces the build while a tab stays open.
// Either way the symptom is the same: a client-side navigation throws
// "ChunkLoadError: Loading chunk ... failed" instead of rendering the page.
//
// There's no way to prevent the chunk reference from going stale — only to
// recover from it. A full reload re-fetches the current build's chunk map,
// which always resolves it. Guard with sessionStorage so a *persistently*
// broken deploy reloads once and then shows the real error instead of
// looping forever.
const RELOAD_GUARD_KEY = 'cq:chunk-error-reload';

function isChunkLoadError(message: unknown): boolean {
  return typeof message === 'string' && /ChunkLoadError|Loading chunk .+ failed/i.test(message);
}

export function ChunkErrorRecovery() {
  useEffect(() => {
    // The page just rendered successfully, so the chunk map is current —
    // clear the guard after a short delay so a *later, unrelated* chunk
    // error can still trigger its own one-time recovery. Only a second
    // error within this window (i.e. the reload didn't fix anything) is
    // treated as a persistent failure and left to surface normally.
    const clearGuard = setTimeout(() => sessionStorage.removeItem(RELOAD_GUARD_KEY), 5000);

    const recover = () => {
      if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.message) || isChunkLoadError(event.error?.message)) recover();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason?.message) || isChunkLoadError(event.reason)) recover();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      clearTimeout(clearGuard);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
