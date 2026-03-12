import { CHANNELS, PREFIX, CHUNK_SIZE_LIMIT } from "./config.js";
import { sendToOpenAI } from "./api.js";
import { startTyping, stopTyping, fixUsername, defineSystemPrompt } from "./util.js";

export const handleMessage = async (msgObj, client) => {
  const { channel } = msgObj;

  // console.log("MESSAGE OBJ");
  // console.log(msgObj);

  const msgIgnore = await checkMsgIgnore(msgObj, client);
  if (!msgIgnore) return null;

  // Early returns for filtering

  const typingInterval = startTyping(channel);

  try {
    const convoArray = await buildConvoArray(channel, client);
    // console.log("CONVO ARRAY");
    // console.log(convoArray);
    const aiMessage = await sendToOpenAI(convoArray);

    // console.log("AI MESSAGE");
    // console.log(aiMessage);

    await sendDiscordMessage(aiMessage, msgObj);
  } catch (error) {
    console.error("Error handling message:", error);
    await msgObj.reply("Sorry, I encountered an error processing your request.");
  } finally {
    stopTyping(typingInterval);
  }
};

export const checkMsgIgnore = async (msgObj, client) => {
  const { content, channelId, mentions } = msgObj;
  // if (author.bot) return null;
  if (!CHANNELS.includes(channelId)) return null;

  const firstChar = content.trim().charAt(0);
  const botMention = mentions.users.has(client.user.id) || null;
  if (firstChar !== PREFIX && !botMention) return null;

  return true;
};

export const buildConvoArray = async (channel, client) => {
  //set system prompt as first msg in array
  const convoArray = defineSystemPrompt();

  const prevMessages = await channel.messages.fetch({ limit: 10 });
  const messagesArray = Array.from(prevMessages.values()).reverse();

  for (let i = 0; i < messagesArray.length; i++) {
    const messageObj = messagesArray[i];
    const { author, content, createdTimestamp } = messageObj;

    const timeCheck = Date.now() - 15 * 60 * 1000; // 15 min ago
    // const timeCheck = Date.now() - 1 * 60 * 1000; // 1 min ago
    if (createdTimestamp < timeCheck) continue;

    if (author.id !== client.user.id && !content.startsWith(PREFIX)) continue;

    const username = fixUsername(author.username);
    const role = author.id === client.user.id ? "assistant" : "user";
    const convoObj = {
      role: role,
      name: username,
      content: content,
    };

    convoArray.push(convoObj);
  }

  return convoArray;
};

//chunks the message into 2000 character chunks
// export const sendDiscordMessage = async (message, inputObj) => {
export const sendDiscordMessage = async (aiMessage, msgObj) => {
  for (let i = 0; i < aiMessage.length; i += CHUNK_SIZE_LIMIT) {
    const chunk = aiMessage.substring(i, i + CHUNK_SIZE_LIMIT);
    await msgObj.reply(chunk);
  }
};
