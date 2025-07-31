const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generateResponse = async (question, documents) => {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-key-here') {
      throw new Error('OpenAI API key not configured');
    }

    // Combine document content as context
    const context = documents.map(doc => doc.content).join('\n\n');
    
    const prompt = `You are a helpful AI assistant. Answer the user's question based on the following documents. If the answer is not in the documents, say "I don't have that information in the provided documents."

Documents:
${context}

Question: ${question}

Answer:`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that answers questions based on provided documents."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error('OpenAI API Error:', error);
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
    }
    throw new Error('Failed to generate AI response');
  }
};

module.exports = { generateResponse };