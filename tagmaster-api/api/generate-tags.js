try {
    const { title = '', description = '' } = req.body || {};
    
    const text = `${title} ${description}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const uniqueWords = [...new Set(words)];
    
    // Remove trademarks
    let safeTags = uniqueWords.filter(tag => !trademarks.includes(tag));
    
    // Fallback: if we got nothing, return generic tags so it doesn't look broken
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
