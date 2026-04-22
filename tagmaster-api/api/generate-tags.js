import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, category, spyUrl } = req.body;

    if (spyUrl) {
      if (!spyUrl.includes('zazzle.com')) {
        return res.status(400).json({ error: 'Invalid Zazzle URL' });
      }

      const pageRes = await fetch(spyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!pageRes.ok) {
        return res.status(400).json({ error: 'Could not fetch competitor page' });
      }

      const html = await pageRes.text();
      const $ = cheerio.load(html);

      let tagsText = $('meta[name="keywords"]').attr('content') || 
                     $('meta[property="og:keywords"]').attr('content') ||
                     '';

      if (!tagsText) {
        $('script[type="application/ld+json"]').each((i, el) => {
          try {
            const json = JSON.parse($(el).html());
            if (json.keywords) tagsText = json.keywords;
          } catch {}
        });
      }

      const spyTags = tagsText
       .split(',')
       .map(t => t.trim())
       .filter(t => t.length > 1 && t.length < 30)
       .slice(0, 13);

      return res.status(200).json({ success: true, spyTags });
    }

    if (!title || title.length < 5) {
      return res.status(400).json({ error: 'Title too short' });
    }

    const prompt = `You are a Zazzle SEO expert. Generate exactly 13 unique, high-traffic search tags for this Zazzle product.

Product Title: "${title}"
Category: "${category || 'general'}"

Rules:
1. Each tag must be 2-4 words long
2. No brand names, trademarks, or copyrighted terms
3. Focus on buyer intent: "birthday gift", "funny mug", "wedding decor"
4. Use US English spelling
5. Return ONLY a JSON array of 13 strings, no explanation

Example: ["funny birthday mug", "coffee lover gift", "dad birthday present"]`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return res.status(500).json({ error: 'OpenAI API error: ' + err });
    }

    const aiData = await openaiRes.json();
    const content = aiData.choices[0].message.content;

    const match = content.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({ error: 'AI returned invalid format' });
    }

    let tags = JSON.parse(match[0]);
    
    tags = tags
     .map(t => String(t).toLowerCase().trim())
     .filter(t => t.length > 2 && t.length < 30)
     .slice(0, 13);

    if (tags.length < 10) {
      return res.status(500).json({ error: 'AI returned too few tags' });
    }

    return res.status(200).json({ success: true, tags });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}