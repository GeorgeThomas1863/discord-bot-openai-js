# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Important: You are the orchestrator. subagents execute. you should NOT build, verify, or code inline (if possible). your job is to plan, prioritize & coordinate the acitons of your subagents

Keep your replies extremely concise and focus on providing necessary information.

Put all pictures / screenshots you take with the mcp plugin in the "pics" subfolder, under the .claude folder in THIS project.

Do NOT commit anything to GitHub. The user will control all commits to GitHub. Do NOT edit or in any way change the user's Git history or interact with GitHub.

If you make a mistake and the user points it out or corrects you, please make note of it here, so you can avoid that mistake in the future.

# discord-bot-openai-js

A Discord bot that integrates with OpenAI's GPT-4 API to provide conversational AI responses
in configured Discord channels. Built with discord.js v13 (ESM) and the OpenAI Node SDK v5.

## Quick Start

```bash
npm install
npm start        # runs: nodemon app.js
```

## Architecture

```
app.js               # Entry point — Discord client init, event wiring
src/
  discord-msg.js     # Message filtering, conversation context builder, typing indicator
  api.js             # OpenAI API call (sendToOpenAI)
  util.js            # Utility helpers
config/              # NOT in repo — cloned via setup-config.sh
  bot.js             # Exports DISCORD_TOKEN, OPENAI_KEY
  config.js          # Exports CONFIG: { CHANNELS, PREFIX, CHUNK_SIZE_LIMIT, TYPING_INTERVAL }
```

## Configuration

Config is stored in a **separate private git repo**, cloned into `config/`:

```bash
bash setup-config.sh <your-config-repo-url>
```

Required exports from `config/bot.js`:
- `DISCORD_TOKEN` — Discord bot token
- `OPENAI_KEY` — OpenAI API key

Required default export from `config/config.js`:
- `CHANNELS` — Array of channel IDs the bot listens in
- `PREFIX` — Command prefix (e.g., `"!"`)
- `CHUNK_SIZE_LIMIT` — Discord message limit (2000)
- `TYPING_INTERVAL` — Typing indicator interval in ms

## Key Behaviors

- Bot responds only in whitelisted `CHANNELS` or when @mentioned
- Builds a 10-message conversation history (last 15 minutes) as context for each GPT-4 call
- Chunks GPT-4 responses into ≤2000 char Discord messages
- Shows typing indicator while processing; clears it on completion or error
- Usernames are sanitized (spaces → underscores, special chars stripped) for OpenAI compat
- 429 (rate limit) errors return a friendly humorous message instead of throwing

## Gotchas

- Uses **discord.js v13** (not v14) — the event name is `"clientReady"`, not `"ready"`
- Package is `"type": "module"` — all files use ESM (`import`/`export`), not CommonJS
- The `config/` directory is gitignored and must be set up manually via `setup-config.sh`
- OpenAI SDK is v5 — API surface differs from v3/v4 (uses `openai.chat.completions.create`)
- System prompt lives in `src/api.js` inline — a commented alternate "argument mode" prompt is also there
