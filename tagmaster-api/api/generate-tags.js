/* /api/generate-tags.js — UPDATED FOR 10-TAG BLUEPRINT */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { title = '', spyUrl = '' } = req.body;

    // ── SPY HANDLER ──────────────────────────────────────────────────────────
    if (spyUrl) {
      // Logic for returning competitor tags if implementing scraping later
      return res.status(200).json({ success: true, tags: [], spyTags: [] });
    }

    const cleanTitle = (title || '').trim();
    if (!cleanTitle || cleanTitle.length < 3) {
      return res.status(400).json({ success: false, error: 'Input product title first' });
    }

    // ── GENERATE ─────────────────────────────────────────────────────────────
    const { tags, blocked } = generateSecretSauceTags(cleanTitle);

    res.status(200).json({
      success: true,
      tags,
      blocked: blocked.length,
      status: blocked.length ? 'Filtered' : '100% SEO Optimized'
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

/* -----------------------------------------------------------------------------
   TAG GENERATION UTILITIES (The Secret Sauce)
   ----------------------------------------------------------------------------- */

function generateSecretSauceTags(title) {
  const raw = title.toLowerCase().trim();
  const occasion = detectOccasion(raw);
  const style = detectStyle(raw);
  const audience = detectAudience(raw);
  const primary = extractPrimary(raw, occasion);

  const tags = [];
  const used = new Set();

  // Helper to ensure 2+ words and no duplicates
  function addTag(tag) {
    if (!tag) return;
    const t = tag.toLowerCase().trim();
    const wordCount = t.split(/\s+/).filter(Boolean).length;
    
    if (wordCount >= 2 && !used.has(t) && tags.length < 10) {
      tags.push(t);
      used.add(t);
    }
  }

  // 1-3: CORE SEO (Primary + Style/Occasion)
  addTag(`${primary} ${style}`);
  if (occasion) addTag(`${primary} ${occasion}`);
  addTag(`${style} ${primary} design`);

  // 4-5: BUYER INTENT (Context Aware)
  if (occasion) {
    addTag(`${occasion} gift idea`);
    addTag(`${occasion} present`);
  } else {
    addTag(`${primary} gift idea`);
    addTag(`unique ${primary} gift`);
  }

  // 6-7: AUDIENCE FOCUS
  if (audience === 'kids') addTag('gift for kids');
  else if (audience === 'women') addTag('gift for her');
  else if (audience === 'men') addTag('gift for him');
  else addTag('special occasion gift');

  // 8-10: STYLE & CATEGORY LONG-TAILS
  const category = detectCategory(raw);
  if (category === 'Stationery/Cards') {
    addTag(`${style} greeting card`);
    addTag(`${occasion || style} stationery`);
  } else if (category === 'Apparel/Shirts') {
    addTag(`${style} graphic apparel`);
    addTag(`funny ${primary} shirt`);
  } else {
    addTag(`${style} home decor`);
    addTag(`artistic ${primary} print`);
  }

  // FINAL FILTER: Trademarks & Banned words
  const { safe, blocked } = ipFilter(tags);

  // EMERGENCY FILLERS (Ensures we always hit 10)
  const emergency = [
    'high quality print',
    'made to order',
    'unique artwork',
    'beautiful design',
    'personalized keepsake',
    'customized gift idea',
    'premium quality art',
    'modern style aesthetic'
  ];

  let idx = 0;
  while (safe.length < 10 && idx < emergency.length) {
    const fill = emergency[idx];
    if (!used.has(fill)) {
      safe.push(fill);
      used.add(fill);
    }
    idx++;
  }

  return { tags: safe.slice(0, 10), blocked };
}

/* ── HELPER FUNCTIONS ─────────────────────────────────────────────────────── */

function ipFilter(tags) {
  const TRADEMARKS = ['disney','marvel','pokemon','nintendo','barbie','star wars','harry potter','lego'];
  const blocked = [];
  const safe = tags.filter(tag => {
    const hit = TRADEMARKS.find(tm => tag.toLowerCase().includes(tm));
    if (hit) blocked.push({ tag, reason: hit });
    return !hit;
  });
  return { safe, blocked };
}

function extractPrimary(text, occasion) {
  let t = text.toLowerCase();
  const suffixes = ['tshirt','t-shirt','shirt','mug','pillow','poster','canvas','card','invitation'];
  suffixes.forEach(s => { if (t.endsWith(s)) t = t.replace(new RegExp(s + '$'), '').trim(); });
  
  const tokens = t.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => 
    w.length > 2 && !['the','and','for','with','gift'].includes(w)
  );
  return tokens.slice(0, 2).join(' ') || 'artistic design';
}

function detectStyle(text) {
  const t = text.toLowerCase();
  if (t.includes('watercolor')) return 'watercolor';
  if (t.includes('floral')) return 'floral';
  if (t.includes('minimalist')) return 'minimalist';
  if (t.includes('vintage') || t.includes('retro')) return 'vintage';
  if (t.includes('funny') || t.includes('cute')) return 'cute';
  return 'stylish';
}

function detectOccasion(text) {
  const t = text.toLowerCase();
  if (t.includes('christmas')) return 'christmas';
  if (t.includes('wedding')) return 'wedding';
  if (t.includes('birthday')) return 'birthday';
  if (t.includes('baby') || t.includes('shower')) return 'baby shower';
  if (t.includes('easter')) return 'easter';
  return null;
}

function detectCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('card') || t.includes('invitation')) return 'Stationery/Cards';
  if (t.includes('shirt') || t.includes('tee')) return 'Apparel/Shirts';
  return 'Home Decor';
}

function detectAudience(text) {
  const t = text.toLowerCase();
  if (t.includes('kid') || t.includes('baby')) return 'kids';
  if (t.includes('mom') || t.includes('her')) return 'women';
  if (t.includes('dad') || t.includes('him')) return 'men';
  return 'general';
}
