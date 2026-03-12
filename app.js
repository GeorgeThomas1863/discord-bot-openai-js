import { Client, GatewayIntentBits } from "discord.js";
import { DISCORD_TOKEN } from "./src/config.js";
import { handleMessage } from "./src/discord-msg.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`${client.user.tag} is now online!`);
});

client.on("messageCreate", (message) => handleMessage(message, client));

client.login(DISCORD_TOKEN);
