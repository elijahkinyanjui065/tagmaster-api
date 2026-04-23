const trademarks = require('./trademarks.js');

module.exports = async (req, res) => {
  // Fix CORS so Zazzle can call it
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { title, description } = req.body;
    
    // Replace this with your real tag logic later
    const fakeTags = ['tag1', 'tag2', 'tag3', 'zazzle', 'gift', 'custom'];
    
    // Filter out trademarks
    const safeTags = fakeTags.filter(tag => !trademarks.includes(tag.toLowerCase()));
    
    return res.status(200).json({ success: true, tags: safeTags });
    
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
