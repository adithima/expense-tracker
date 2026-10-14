
const { GoogleGenAI } = require('@google/genai');

const askAI = async (systemPrompt, userMessage) => {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error('AI_API_KEY is missing from environment variables.');
  }

  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model: process.env.AI_MODEL || 'gemini-2.5-flash',
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 400,
    },
  });

  const answer = response.text;

  if (!answer) {
    throw new Error('Gemini returned an empty response.');
  }

  return answer;
};

module.exports = { askAI };
