const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}

async function chat(messages, tools = null, userId = null) {
  try {
    const params = {
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
    };

    if (tools && tools.length > 0) {
      params.tools = tools;
      params.tool_choice = 'auto';
    }

    const response = await openai.chat.completions.create(params);
    return response.choices[0].message;
  } catch (error) {
    console.error('Error in chat completion:', error);
    throw error;
  }
}

module.exports = {
  openai,
  createEmbedding,
  chat,
};
