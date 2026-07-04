// Lightweight same-tab change bus for the localStorage-backed repos.
//
// localStorage writes don't fire a `storage` event in the tab that made them,
// so a page that already mounted (e.g. the calendar) won't see edits another
// view (e.g. the plan board) just wrote. Repos call `notifyDataChange()` after
// a write; pages `subscribeDataChange()` and re-read. Cross-tab updates are
// covered by also relaying the native `storage` event.

type Listener = () => void;

const listeners = new Set<Listener>();

export function notifyDataChange(): void {
  for (const cb of listeners) cb();
}

// Subscribe to data changes (same-tab notifications + cross-tab storage events).
// Returns an unsubscribe function.
export function subscribeDataChange(cb: Listener): () => void {
  listeners.add(cb);

  const onStorage = () => cb();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}
