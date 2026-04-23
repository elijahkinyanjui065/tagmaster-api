export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { title = '', description = '' } = req.body || {};
    
    const text = `${title} ${description}`.toLowerCase();
    const pool = text.match(/\b[a-z]{3,}\b/g) || [];
    const uniquePool = [...new Set(pool)];

    // Your filter - this is the key part
    const candidates = uniquePool.filter(tag => {
      const lower = tag.toLowerCase().trim();
      
      // 1. Block spammy meta-words
      if (/\b(post|for|my|the|best|good|top|cheap|sale|promotion)\b/i.test(lower)) {
        return false;
      }

      // 2. Block "for product / sale for product"-style phrases  
      if (/\b(for|sale)\s+[a-z]+\s*[a-z]*\s*\b(product|item|good|stuff|thing)\b/i.test(lower)) {
        return false;
      }

      // 3. Keep reasonable length and word-count
      const words = lower.split(/\s+/);
      return (
        lower.length >= 4 &&
        lower.length <= 24 &&
        words.length >= 1 &&
        words.length <= 3
      );
    });

    // Fallback if filter kills everything
    let finalTags = candidates;
    if (finalTags.length === 0) {
      finalTags = ['design','gift','custom','art','trendy','popular','unique','fun'];
    }
    
    return res.status(200).json({ 
      success: true, 
      tags: finalTags.slice(0, 20) 
    });
    
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
