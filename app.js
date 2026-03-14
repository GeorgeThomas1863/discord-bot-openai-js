//keep testing

import 'dotenv/config';
import { Client, Intents } from "discord.js";
import { handleMessage } from "./src/discord-msg.js";

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT,
  ],
});

client.once("clientReady", () => {
  console.log(`${client.user.tag} is now online!`);
});

client.on("messageCreate", (message) => handleMessage(message, client));

client.login(process.env.DISCORD_TOKEN);
