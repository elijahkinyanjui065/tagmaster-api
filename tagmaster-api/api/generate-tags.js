export default async function handler(req, res) {
  // CORS headers - must be first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Trademark list - add more as needed
  const trademarks = [
    'nike', 'adidas', 'disney', 'marvel', 'starwars', 'star wars',
    'pokemon', 'nintendo', 'mario', 'zelda', 'harry potter', 'barbie'
  ];

  try {
    const { title = '', description = '' } = req.body || {};
    
    const text = `${title} ${description}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const uniqueWords = [...new Set(words)];
    
    // Remove trademarks
    let safeTags = uniqueWords.filter(tag => !trademarks.includes(tag));
    
    // Fallback if empty
    if (safeTags.length === 0) {
      safeTags = ['design','gift','custom','art','trendy','popular','zazzle','product'];
    }
    
    return res.status(200).json({ 
      success: true, 
      tags: safeTags.slice(0, 20) 
    });
    
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
