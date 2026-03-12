import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Keys touched by these tests — saved once and restored after each test.
const MANAGED_KEYS = [
  'DISCORD_TOKEN',
  'OPENAI_KEY',
  'CHANNELS',
  'PREFIX',
  'CHUNK_SIZE_LIMIT',
  'TYPING_INTERVAL',
  'MODEL',
];

let savedEnv = {};

beforeEach(() => {
  vi.resetModules();
  // Save originals
  savedEnv = {};
  for (const key of MANAGED_KEYS) {
    savedEnv[key] = process.env[key];
  }
  // Clear all managed keys before each test
  for (const key of MANAGED_KEYS) {
    delete process.env[key];
  }
});

afterEach(() => {
  // Restore originals
  for (const key of MANAGED_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

// Helper — set only the keys the caller provides, leave the rest deleted.
function setEnv(overrides = {}) {
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Required-var validation
// ---------------------------------------------------------------------------
describe('config.js — required env var validation', () => {
  it('throws when DISCORD_TOKEN is missing', async () => {
    setEnv({ OPENAI_KEY: 'sk-test', CHANNELS: '123' });
    await expect(import('../src/config.js')).rejects.toThrow('DISCORD_TOKEN');
  });

  it('throws when OPENAI_KEY is missing', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', CHANNELS: '123' });
    await expect(import('../src/config.js')).rejects.toThrow('OPENAI_KEY');
  });

  it('throws when CHANNELS is missing', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'sk-test' });
    await expect(import('../src/config.js')).rejects.toThrow('CHANNELS');
  });
});

// ---------------------------------------------------------------------------
// Successful import — core exports
// ---------------------------------------------------------------------------
describe('config.js — exports when all required vars are set', () => {
  it('exports DISCORD_TOKEN and OPENAI_KEY with the values provided', async () => {
    setEnv({ DISCORD_TOKEN: 'my-token', OPENAI_KEY: 'my-key', CHANNELS: '111' });
    const config = await import('../src/config.js');
    expect(config.DISCORD_TOKEN).toBe('my-token');
    expect(config.OPENAI_KEY).toBe('my-key');
  });

  it('splits CHANNELS on commas', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: '111,222,333' });
    const { CHANNELS } = await import('../src/config.js');
    expect(CHANNELS).toEqual(['111', '222', '333']);
  });

  it('trims whitespace from each channel in CHANNELS', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: ' 111 , 222 , 333 ' });
    const { CHANNELS } = await import('../src/config.js');
    expect(CHANNELS).toEqual(['111', '222', '333']);
  });
});

// ---------------------------------------------------------------------------
// Optional vars — defaults
// ---------------------------------------------------------------------------
describe('config.js — optional env var defaults', () => {
  it('PREFIX defaults to "!" when not set', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: '111' });
    const { PREFIX } = await import('../src/config.js');
    expect(PREFIX).toBe('!');
  });

  it('PREFIX uses the provided value when set', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: '111', PREFIX: '?' });
    const { PREFIX } = await import('../src/config.js');
    expect(PREFIX).toBe('?');
  });

  it('CHUNK_SIZE_LIMIT defaults to 2000 when not set', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: '111' });
    const { CHUNK_SIZE_LIMIT } = await import('../src/config.js');
    expect(CHUNK_SIZE_LIMIT).toBe(2000);
  });

  it('CHUNK_SIZE_LIMIT is parsed as an integer', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: '111', CHUNK_SIZE_LIMIT: '1500' });
    const { CHUNK_SIZE_LIMIT } = await import('../src/config.js');
    expect(CHUNK_SIZE_LIMIT).toBe(1500);
    expect(typeof CHUNK_SIZE_LIMIT).toBe('number');
  });

  it('TYPING_INTERVAL defaults to 5000 when not set', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: '111' });
    const { TYPING_INTERVAL } = await import('../src/config.js');
    expect(TYPING_INTERVAL).toBe(5000);
  });

  it('TYPING_INTERVAL is parsed as an integer', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: '111', TYPING_INTERVAL: '8000' });
    const { TYPING_INTERVAL } = await import('../src/config.js');
    expect(TYPING_INTERVAL).toBe(8000);
    expect(typeof TYPING_INTERVAL).toBe('number');
  });

  it('MODEL defaults to "gpt-5.4" when not set', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: '111' });
    const { MODEL } = await import('../src/config.js');
    expect(MODEL).toBe('gpt-5.4');
  });

  it('MODEL uses the provided value when set', async () => {
    setEnv({ DISCORD_TOKEN: 'tok', OPENAI_KEY: 'key', CHANNELS: '111', MODEL: 'gpt-4o' });
    const { MODEL } = await import('../src/config.js');
    expect(MODEL).toBe('gpt-4o');
  });
});
