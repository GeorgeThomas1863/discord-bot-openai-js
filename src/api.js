import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export const sendToOpenAI = async (inputArray) => {
  const model = process.env.MODEL ?? 'gpt-5.4';
  const params = { model, messages: inputArray };

  try {
    const res = await openai.chat.completions.create(params);
    return res.choices[0].message.content;
  } catch (e) {
    console.error("OpenAI API Error:", e.message);
    if (e.status === 429) return "SAM ALTMAN WANT HIS MONEY (George didn't pay his API bill)";
    throw new Error("Failed to get response from OpenAI");
  }
};
