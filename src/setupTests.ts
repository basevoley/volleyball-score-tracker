import '@testing-library/jest-dom';

// Newer Node versions ship a global `localStorage` that shadows jsdom's and is unusable without
// --localstorage-file; fall back to an in-memory implementation so storage-backed code is testable.
if (typeof globalThis.localStorage?.clear !== 'function') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: key => store.get(key) ?? null,
    key: index => Array.from(store.keys())[index] ?? null,
    removeItem: key => { store.delete(key); },
    setItem: (key, value) => { store.set(key, String(value)); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
}
