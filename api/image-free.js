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
    const prompt = encodeURIComponent(req.body.inputs);
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=768&height=768&nologo=true&seed=${Date.now()}`;
    
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Pollinations error: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(buffer);
    
  } catch (error) {
    console.error('Image error:', error);
    res.status(500).json({ 
      error: {
        message: error.message,
        type: 'server_error'
      }
    });
  }
}