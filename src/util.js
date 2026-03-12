export const fixUsername = (username) => {
  return username.replace(/\s+/g, "_").replace(/[^\w\s]/gi, "");
};

export const startTyping = (channel) => {
  const TYPING_INTERVAL = parseInt(process.env.TYPING_INTERVAL ?? '5000', 10);
  channel.sendTyping();
  return setInterval(() => {
    channel.sendTyping();
  }, TYPING_INTERVAL);
};

export const stopTyping = (typingInterval) => {
  clearInterval(typingInterval);
};

//returns array
export const defineSystemPrompt = () => {
  const systemPrompt = [
    {
      role: "system",
      content:
        "You are a helpful, friendly, and clever assistant. Please provide a response to the following message or messages. Please review all of the content provided and respond with a detailed but very CONCISE reply. Please ensure your response is concise and to the point.",
    },

    // {
    //   role: "system",
    //   content:
    //     "You are a helpful, friendly, and clever assistant. You are in a heated argument with the user. The user is on Team B, you are on Team A. Please argue from Team A's point of view. Be sure to respond to whatever the user is claiming or arguing, be passionate and convincing, but be very concise and to the point.",
    // },
  ];

  return systemPrompt;
};
