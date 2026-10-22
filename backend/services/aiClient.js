const { GoogleGenAI } = require('@google/genai');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async (systemPrompt, userMessage) => {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error('AI_API_KEY is missing from environment variables.');
  }

  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model: process.env.AI_MODEL || 'gemini-3.8-flash',
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

const askAI = async (systemPrompt, userMessage, retries = 1) => {
  try {
    return await callGemini(systemPrompt, userMessage);
  } catch (err) {
    const isOverloaded =
      err?.status === 503 ||
      err?.message?.includes('UNAVAILABLE') ||
      err?.message?.includes('overloaded') ||
      err?.message?.includes('high demand');

    if (isOverloaded && retries > 0) {
      await sleep(1500); // wait 1.5s, then try once more before giving up
      return askAI(systemPrompt, userMessage, retries - 1);
    }

    throw err;
  }
};

module.exports = { askAI };