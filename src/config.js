import 'dotenv/config';

const required = ['DISCORD_TOKEN', 'OPENAI_KEY', 'CHANNELS'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

export const DISCORD_TOKEN    = process.env.DISCORD_TOKEN;
export const OPENAI_KEY       = process.env.OPENAI_KEY;
export const CHANNELS         = process.env.CHANNELS.split(',').map(s => s.trim());
export const PREFIX           = process.env.PREFIX ?? '!';
export const CHUNK_SIZE_LIMIT = parseInt(process.env.CHUNK_SIZE_LIMIT ?? '2000', 10);
export const TYPING_INTERVAL  = parseInt(process.env.TYPING_INTERVAL ?? '5000', 10);
export const MODEL            = process.env.MODEL ?? 'gpt-5.4';
