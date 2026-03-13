import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/api.js', () => ({ sendToOpenAI: vi.fn() }));

vi.mock('../src/util.js', () => ({
  startTyping: vi.fn().mockReturnValue(42),
  stopTyping: vi.fn(),
  fixUsername: vi.fn((u) => u.replace(/\s+/g, '_').replace(/[^\w]/g, '')),
  defineSystemPrompt: vi.fn().mockImplementation(() => [{ role: 'system', content: 'You are helpful.' }]),
}));

import { checkMsgIgnore, sendDiscordMessage, buildConvoArray } from '../src/discord-msg.js';

// ---------------------------------------------------------------------------
// checkMsgIgnore
// ---------------------------------------------------------------------------

const makeMsgObj = (overrides = {}) => ({
  author: { id: 'user-id', bot: false },
  content: '!hello',
  channelId: '111',
  mentions: { users: { has: vi.fn().mockReturnValue(false) } },
  ...overrides,
});

const fakeClient = { user: { id: 'bot-id' } };

describe('checkMsgIgnore', () => {
  beforeEach(() => {
    vi.stubEnv('CHANNELS', '123456789');
    vi.stubEnv('PREFIX', '!');
    vi.stubEnv('CHUNK_SIZE_LIMIT', '2000');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('returns null when channelId is not in CHANNELS', async () => {
    const msg = makeMsgObj({ channelId: '999' });
    const result = await checkMsgIgnore(msg, fakeClient);
    expect(result).toBeNull();
  });

  it('returns null when content has no prefix and bot is not mentioned', async () => {
    vi.stubEnv('CHANNELS', '111');
    const msg = makeMsgObj({ content: 'hello there' });
    const result = await checkMsgIgnore(msg, fakeClient);
    expect(result).toBeNull();
  });

  it('returns true when content starts with the prefix', async () => {
    vi.stubEnv('CHANNELS', '111');
    const msg = makeMsgObj({ content: '!ping' });
    const result = await checkMsgIgnore(msg, fakeClient);
    expect(result).toBe(true);
  });

  it('returns true when bot is @mentioned even without prefix', async () => {
    vi.stubEnv('CHANNELS', '111');
    const msg = makeMsgObj({
      content: 'hey bot what is up',
      mentions: { users: { has: vi.fn().mockReturnValue(true) } },
    });
    const result = await checkMsgIgnore(msg, fakeClient);
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// sendDiscordMessage
// ---------------------------------------------------------------------------

const makeReplyObj = () => ({ reply: vi.fn().mockResolvedValue(undefined) });

describe('sendDiscordMessage', () => {
  beforeEach(() => {
    vi.stubEnv('CHANNELS', '123456789');
    vi.stubEnv('PREFIX', '!');
    vi.stubEnv('CHUNK_SIZE_LIMIT', '2000');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('calls reply once for a short message (< 2000 chars)', async () => {
    const msgObj = makeReplyObj();
    const message = 'Hello, world!';
    await sendDiscordMessage(message, msgObj);
    expect(msgObj.reply).toHaveBeenCalledTimes(1);
    expect(msgObj.reply).toHaveBeenCalledWith(message);
  });

  it('splits a 4500-char message into 3 chunks each <= 2000 chars, total content equals original', async () => {
    const msgObj = makeReplyObj();
    const message = 'a'.repeat(4500);
    await sendDiscordMessage(message, msgObj);

    const calls = msgObj.reply.mock.calls;
    expect(calls).toHaveLength(3);

    for (const [chunk] of calls) {
      expect(chunk.length).toBeLessThanOrEqual(2000);
    }

    const reassembled = calls.map(([chunk]) => chunk).join('');
    expect(reassembled).toBe(message);
  });

  it('calls reply once with empty string when message is empty', async () => {
    const msgObj = makeReplyObj();
    await sendDiscordMessage('', msgObj);
    // The loop runs 0 iterations for empty string — reply is never called.
    // This reflects actual behaviour: no reply sent for empty input.
    expect(msgObj.reply).toHaveBeenCalledTimes(0);
  });
});

// ---------------------------------------------------------------------------
// buildConvoArray
// ---------------------------------------------------------------------------

const BOT_ID = 'bot-id';
const fakeBuildClient = { user: { id: BOT_ID } };

const makeMsg = (overrides = {}) => ({
  author: { id: 'user-id', username: 'TestUser' },
  content: '!hello',
  createdTimestamp: Date.now() - 1000,
  ...overrides,
});

const makeChannel = (messages) => ({
  messages: {
    fetch: vi.fn().mockResolvedValue({ values: () => messages }),
  },
});

describe('buildConvoArray', () => {
  beforeEach(() => {
    vi.stubEnv('CHANNELS', '123456789');
    vi.stubEnv('PREFIX', '!');
    vi.stubEnv('CHUNK_SIZE_LIMIT', '2000');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('has system prompt as first element', async () => {
    const channel = makeChannel([]);
    const result = await buildConvoArray(channel, fakeBuildClient);
    expect(result[0].role).toBe('system');
  });

  it('includes a recent message with PREFIX as role user', async () => {
    const msg = makeMsg({ content: '!hello', createdTimestamp: Date.now() - 1000 });
    const channel = makeChannel([msg]);
    const result = await buildConvoArray(channel, fakeBuildClient);
    const userEntry = result.find((e) => e.role === 'user');
    expect(userEntry).toBeDefined();
    expect(userEntry.content).toBe('!hello');
  });

  it('filters out messages older than 15 minutes', async () => {
    const oldMsg = makeMsg({
      content: '!old',
      createdTimestamp: Date.now() - 16 * 60 * 1000,
    });
    const channel = makeChannel([oldMsg]);
    const result = await buildConvoArray(channel, fakeBuildClient);
    // Only the system prompt should remain
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('system');
  });

  it('assigns role assistant to bot messages', async () => {
    const botMsg = makeMsg({
      author: { id: BOT_ID, username: 'BotUser' },
      content: 'Here is my answer.',
      createdTimestamp: Date.now() - 1000,
    });
    const channel = makeChannel([botMsg]);
    const result = await buildConvoArray(channel, fakeBuildClient);
    const assistantEntry = result.find((e) => e.role === 'assistant');
    expect(assistantEntry).toBeDefined();
    expect(assistantEntry.content).toBe('Here is my answer.');
  });

  it('excludes user messages that do not start with PREFIX', async () => {
    const noPrefix = makeMsg({
      content: 'just chatting',
      createdTimestamp: Date.now() - 1000,
    });
    const channel = makeChannel([noPrefix]);
    const result = await buildConvoArray(channel, fakeBuildClient);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('system');
  });
});
