//keep testing

import 'dotenv/config';
import { Client, GatewayIntentBits } from "discord.js";
import { handleMessage } from "./src/discord-msg.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`${client.user.tag} is now online!`);
});

client.on("messageCreate", (message) => handleMessage(message, client));

client.login(process.env.DISCORD_TOKEN);
