/**
 * Vitest Setup File
 *
 * Sets up global mocks and configurations for all tests.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

// Mock localStorage for Node.js environment (needed for i18n module)
// Uses a backing store to actually persist data during tests
function createLocalStorageMock() {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null
  };
}

const localStorageMock = createLocalStorageMock();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage as well (if needed)
Object.defineProperty(globalThis, 'sessionStorage', {
  value: localStorageMock,
  writable: true
});
