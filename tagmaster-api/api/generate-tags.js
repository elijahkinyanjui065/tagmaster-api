const trademarks = require('./trademarks.js');

module.exports = async (req, res) => {
  // These 3 lines MUST be first before any other code
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
    const { title = '', description = '' } = req.body || {};
    
    // Basic tag generation - no fancy stuff that can break
    const text = `${title} ${description}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const uniqueWords = [...new Set(words)];
    
    // Remove trademarks
    const safeTags = uniqueWords.filter(tag => !trademarks.includes(tag));
    
    return res.status(200).json({ 
      success: true, 
      tags: safeTags.slice(0, 20) 
    });
    
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
