import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('openai', () => ({
  OpenAI: class {
    constructor() {
      this.chat = { completions: { create: mockCreate } };
    }
  },
}));

import { sendToOpenAI } from '../src/api.js';

describe('sendToOpenAI', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    vi.stubEnv('OPENAI_KEY', 'test-key');
    vi.stubEnv('MODEL', 'gpt-5.4');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('returns the message content string on success', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Hello!' } }],
    });

    const result = await sendToOpenAI([{ role: 'user', content: 'Hi' }]);
    expect(result).toBe('Hello!');
  });

  it('calls create with the correct model and messages', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'OK' } }],
    });

    const input = [{ role: 'user', content: 'Test message' }];
    await sendToOpenAI(input);

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-5.4',
      messages: input,
    });
  });

  it('returns a non-empty humorous string on 429 error without throwing', async () => {
    const err = new Error('Rate limited');
    err.status = 429;
    mockCreate.mockRejectedValue(err);

    const result = await sendToOpenAI([{ role: 'user', content: 'Hi' }]);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('throws on non-429 errors', async () => {
    const err = new Error('Internal server error');
    err.status = 500;
    mockCreate.mockRejectedValue(err);

    await expect(sendToOpenAI([{ role: 'user', content: 'Hi' }])).rejects.toThrow();
  });
});
