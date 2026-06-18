const db = require('../config/db');

// List of simple keywords we look for to retrieve products from SQL database
const KEYWORD_MAP = {
  laptop: ['laptop', 'laptops', 'computer', 'notebook', 'macbook', 'asus', 'dell', 'xps', 'zephyrus'],
  phone: ['phone', 'phones', 'smartphone', 'smartphones', 'iphone', 'samsung', 's24', 'galaxy', 'mobile'],
  gaming: ['gaming', 'console', 'playstation', 'ps5', 'slim', 'sony'],
  audio: ['audio', 'headphone', 'headphones', 'sound', 'anc', 'xm5', 'sony'],
  accessory: ['accessory', 'accessories', 'watch', 'apple watch', 'wearable', 'ultra 2']
};

// All brands
const BRANDS = ['apple', 'samsung', 'sony', 'dell', 'asus'];

async function handleChat(req, res) {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    // 1. Retrieve Phase: Scan user message for keywords
    const lowerMessage = message.toLowerCase();
    const matchedKeywords = [];
    const matchedBrands = [];

    // Check brand matches
    BRANDS.forEach(brand => {
      if (lowerMessage.includes(brand)) {
        matchedBrands.push(brand);
      }
    });

    // Check category/product keywords
    Object.keys(KEYWORD_MAP).forEach(category => {
      const aliases = KEYWORD_MAP[category];
      const match = aliases.some(alias => lowerMessage.includes(alias));
      if (match) {
        matchedKeywords.push(category);
      }
    });

    // Retrieve products based on matches
    let products = [];

    if (matchedKeywords.length > 0 || matchedBrands.length > 0) {
      let queryStr = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        JOIN categories c ON p.category_id = c.id
        WHERE 
      `;
      const queryParams = [];
      const conditions = [];

      // Add category matches
      matchedKeywords.forEach(keyword => {
        conditions.push('c.slug LIKE ? OR p.title LIKE ? OR p.description LIKE ?');
        queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      });

      // Add brand matches
      matchedBrands.forEach(brand => {
        conditions.push('p.brand LIKE ?');
        queryParams.push(`%${brand}%`);
      });

      queryStr += conditions.join(' OR ');

      // Execute SQL query
      products = await db.query(queryStr, queryParams);
    }

    // Limit context size to top 5 matches
    const relevantProducts = products.slice(0, 5);

    // Format products context
    let productContext = '';
    if (relevantProducts.length > 0) {
      productContext = relevantProducts.map(p => 
        `- ${p.title} (${p.brand}) - Price: $${p.price} - Stock: ${p.stock} units. Description: ${p.description}`
      ).join('\n');
    } else {
      productContext = 'No specific matching products found in database.';
    }

    // 2. Augment Phase: Create System Prompt
    const systemPrompt = `You are "Nova", a helpful and professional AI shopping assistant for the "TechNova Marketplace" electronics store.
Your goal is to assist customers with their product inquiries.

Rules:
1. Answer the customer's query using the live store inventory context below.
2. If the customer is asking for product recommendations, use the inventory details to give accurate suggestions (include brand name, price, and description).
3. If they ask about products that are NOT in the inventory context, politely tell them we don't have them in stock and suggest related items we do have.
4. Keep answers concise, helpful, and friendly.

Live Inventory Context:
${productContext}
`;

    const geminiApiKey = process.env.GEMINI_API_KEY;

    // 3. Generate Phase: Call Gemini or Fallback
    if (!geminiApiKey || geminiApiKey === 'your_actual_free_api_key_here') {
      // Fallback response for offline/learning mode without API key
      console.log('[AI Chatbot] No Gemini API key found. Using rule-based fallback response.');
      
      let replyText = '';
      if (relevantProducts.length > 0) {
        replyText = `Hi! I found some matching products in our inventory for you: \n\n` + 
          relevantProducts.map(p => `• **${p.title}** by ${p.brand} ($${p.price}) - ${p.stock} in stock.`).join('\n') +
          `\n\n*(Note: Set GEMINI_API_KEY in backend/.env to enable natural conversation)*`;
      } else {
        replyText = `Hello! I'm Nova, your TechNova assistant. I couldn't find specific products matching your query. We sell Laptops, Smartphones, Audio, Gaming Consoles, and Accessories! Let me know if you want to look at those.\n\n*(Note: Set GEMINI_API_KEY in backend/.env to enable natural conversation)*`;
      }

      return res.json({ reply: replyText });
    }

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API request failed:', errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process that message.';

    return res.json({ reply });

  } catch (error) {
    console.error('AI Chatbot error:', error);
    return res.status(500).json({ message: 'Server error processing your chat request.' });
  }
}

module.exports = {
  handleChat
};
