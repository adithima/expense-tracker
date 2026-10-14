const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.AI_API_KEY });

const askAI = async (systemPrompt, userMessage) => {
  const response = await client.messages.create({
    model: process.env.AI_MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  return response.content[0].text;
};

module.exports = { askAI };