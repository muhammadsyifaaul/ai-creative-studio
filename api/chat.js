export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const isGroq = apiKey.startsWith('gsk_');

    if (isGroq) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: req.body.messages,
          max_tokens: req.body.max_tokens || 1024,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      
      const anthropicFormat = {
        content: [{
          type: 'text',
          text: data.choices[0].message.content
        }],
        model: data.model,
        role: 'assistant'
      };
      
      res.status(200).json(anthropicFormat);
    } else {
      throw new Error('Invalid API key format');
    }
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: {
        message: error.message,
        type: 'server_error'
      }
    });
  }
}