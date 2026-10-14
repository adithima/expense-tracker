
const { GoogleGenAI } = require('@google/genai');

const client = new GoogleGenAI({
  apiKey: process.env.AI_API_KEY,
});

const askAI = async (systemPrompt, userMessage) => {
  const response = await client.models.generateContent({
    model: process.env.AI_MODEL || 'gemini-2.5-flash',
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 400,
    },
  });

  return response.text;
};

module.exports = { askAI };
