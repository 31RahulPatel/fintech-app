const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are Bazar.ai, a helpful financial assistant for FintechOps platform. 
You specialize in:
- Indian stock market analysis and insights
- Financial planning and investment advice
- Explaining financial concepts in simple terms
- Market news interpretation
- Mutual funds, SIPs, and other investment options
- Tax planning and savings strategies

Always provide accurate, helpful information. When discussing investments, remind users that past performance doesn't guarantee future results and to consult financial advisors for personalized advice.

Be professional yet friendly. Use Indian financial terminology where appropriate (Sensex, Nifty, SEBI, etc.).`;

class GroqService {
  async chat(message, history = []) {
    try {
      // Build messages array
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT }
      ];

      // Add history (last 10 messages)
      history.slice(-10).forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current message
      messages.push({ role: 'user', content: message });

      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      });

      const response = chatCompletion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      logger.info('Groq chat completion successful');
      return response;
    } catch (error) {
      logger.error(`Groq API error: ${error.message}`);
      
      // Return a fallback response
      if (error.message.includes('API key')) {
        return 'I apologize, but I am currently unavailable. Please try again later.';
      }
      
      throw error;
    }
  }

  async generatePromptResponse(prompt) {
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ];

      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        stream: false
      });

      const response = chatCompletion.choices[0]?.message?.content || 'Unable to generate response.';

      logger.info('Groq scheduled prompt completed');
      return response;
    } catch (error) {
      logger.error(`Groq scheduled prompt error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new GroqService();
