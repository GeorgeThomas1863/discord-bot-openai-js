import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import after mock is registered
const { fixUsername, defineSystemPrompt, startTyping, stopTyping } =
  await import('../src/util.js');

// ---------------------------------------------------------------------------
// fixUsername
// ---------------------------------------------------------------------------
describe('fixUsername', () => {
  it('replaces spaces with underscores', () => {
    expect(fixUsername('hello world')).toBe('hello_world');
  });

  it('replaces multiple consecutive spaces with a single underscore', () => {
    expect(fixUsername('hello   world')).toBe('hello_world');
  });

  it('strips special characters like !, @, #', () => {
    expect(fixUsername('user!@#')).toBe('user');
  });

  it('preserves underscores and alphanumeric characters', () => {
    expect(fixUsername('user_Name123')).toBe('user_Name123');
  });

  it('handles an empty string', () => {
    expect(fixUsername('')).toBe('');
  });

  it('handles a username composed entirely of special characters', () => {
    expect(fixUsername('!@#$%^&*()')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// defineSystemPrompt
// ---------------------------------------------------------------------------
describe('defineSystemPrompt', () => {
  it('returns an array', () => {
    expect(Array.isArray(defineSystemPrompt())).toBe(true);
  });

  it('returns an array with exactly 1 element', () => {
    expect(defineSystemPrompt()).toHaveLength(1);
  });

  it('has role: "system" on the first element', () => {
    expect(defineSystemPrompt()[0].role).toBe('system');
  });

  it('has a non-empty content string on the first element', () => {
    const content = defineSystemPrompt()[0].content;
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// startTyping / stopTyping
// ---------------------------------------------------------------------------
describe('startTyping / stopTyping', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('TYPING_INTERVAL', '5000');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('calls channel.sendTyping() immediately when startTyping is called', () => {
    const channel = { sendTyping: vi.fn() };
    startTyping(channel);
    expect(channel.sendTyping).toHaveBeenCalledTimes(1);
  });

  it('startTyping returns a truthy interval ID', () => {
    const channel = { sendTyping: vi.fn() };
    const id = startTyping(channel);
    expect(id).toBeTruthy();
  });

  it('stopTyping clears the interval so sendTyping is not called again', () => {
    const channel = { sendTyping: vi.fn() };
    const id = startTyping(channel);

    // Clear before any interval fires
    stopTyping(id);

    // Advance time past TYPING_INTERVAL (5000 ms)
    vi.advanceTimersByTime(10000);

    // Only the initial synchronous call should have happened
    expect(channel.sendTyping).toHaveBeenCalledTimes(1);
  });

  it('sendTyping is called again after one TYPING_INTERVAL if not stopped', () => {
    const channel = { sendTyping: vi.fn() };
    startTyping(channel);

    vi.advanceTimersByTime(5000);

    // 1 immediate + 1 after interval
    expect(channel.sendTyping).toHaveBeenCalledTimes(2);
  });
});
