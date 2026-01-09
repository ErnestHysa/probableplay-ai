/**
 * Test Setup
 *
 * Global setup for vitest tests.
 */

import { expect, beforeEach, vi } from 'vitest';

// Mock crypto.randomUUID for environments that don't support it
global.crypto = {
  randomUUID: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
} as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

// Extend expect with custom matchers if needed
expect.extend({});
