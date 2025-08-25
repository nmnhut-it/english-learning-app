import { beforeEach, vi } from 'vitest';

// Mock Web Audio API
global.AudioContext = vi.fn(() => ({
  createBufferSource: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 },
  })),
  destination: {},
  decodeAudioData: vi.fn(),
}));

// Mock AnimationEvent for DOM animations
global.AnimationEvent = class MockAnimationEvent extends Event {
  constructor(type: string, eventInitDict?: AnimationEventInit) {
    super(type, eventInitDict);
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock fetch for AI services
global.fetch = vi.fn();

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.body.innerHTML = '';
});