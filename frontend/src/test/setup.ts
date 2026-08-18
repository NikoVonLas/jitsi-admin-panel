import '@testing-library/jest-dom';
import { act } from 'react';
import { afterEach } from 'vitest';

class MemoryStorage implements Storage {
  readonly #values = new Map<string, string>();

  get length() {
    return this.#values.size;
  }

  clear() {
    this.#values.clear();
  }

  getItem(key: string) {
    return this.#values.get(String(key)) ?? null;
  }

  key(index: number) {
    return [...this.#values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.#values.delete(String(key));
  }

  setItem(key: string, value: string) {
    this.#values.set(String(key), String(value));
  }
}

function createStorage(): Storage {
  const storage = new MemoryStorage();
  return new Proxy(storage, {
    ownKeys: () => Array.from({ length: storage.length }, (_, i) => storage.key(i) as string),
    getOwnPropertyDescriptor: (_target, property) => {
      if (typeof property === 'string' && storage.getItem(property) !== null) {
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value: storage.getItem(property),
        };
      }
      return undefined;
    },
    get: (target, property) => {
      if (typeof property === 'string' && target.getItem(property) !== null)
        return target.getItem(property);
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: createStorage(),
});

Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: createStorage(),
});

const getComputedStyle = globalThis.getComputedStyle.bind(globalThis);
Object.defineProperty(globalThis, 'getComputedStyle', {
  configurable: true,
  value: (element: Element) => getComputedStyle(element),
});

// Mock window.matchMedia (not available in jsdom)
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Silence act() warnings in React 19 tests
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Resolve state updates scheduled by fulfilled mock promises before each test
// is cleaned up. Individual tests still await observable async behaviour where
// that behaviour is part of the assertion.
afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
});
