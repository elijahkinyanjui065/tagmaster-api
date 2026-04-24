// ==============================
// Zazzle Tags Master — CORS SAFE BUILD + SMART TAGS
// ==============================

// ---------- TRADEMARK FILTER ----------
const TRADEMARKS = [
  'disney','marvel','pokemon','nintendo','barbie','hello kitty','star wars',
  'harry potter','minecraft','fortnite','pixar','dreamworks','nickelodeon',
  'lego','superman','batman','spiderman','avengers','frozen','moana',
  'star trek','lord of the rings','dc comics','mickey','minnie'
];

function ipFilter(tags = []) {
  try {
    const blocked = [];
    const safe = tags.filter(tag => {
      if (!tag) return false;
      const t = tag.toLowerCase();
      if (t.length < 2) return false;
      const hit = TRADEMARKS.some(tm => t.includes(tm));
      if (hit) blocked.push(tag);
      return !hit;
    });
    return { safe, blocked };
  } catch (e) {
    return { safe: tags, blocked: [] };
  }
}

// ---------- HELPERS ----------
function detectOccasion(text = '') {
  const t = text.toLowerCase();
  if (t.includes('easter')) return 'easter';
  if (t.includes('birthday')) return 'birthday';
  if (t.includes('christmas')) return 'christmas';
  if (t.includes('wedding')) return 'wedding';
  if (t.includes('halloween')) return 'halloween';
  if (t.includes('baby') || t.includes('shower')) return 'baby';
  return null;
}

function detectStyle(text = '') {
  const t = text.toLowerCase();
  if (t.includes('watercolor')) return 'watercolor';
  if (t.includes('floral')) return 'floral';
  if (t.includes('cute')) return 'cute';
  if (t.includes('vintage')) return 'vintage';
  if (t.includes('minimal')) return 'minimalist';
  if (t.includes('colorful')) return 'colorful';
  if (t.includes('pastel')) return 'pastel';
  return null;
}

function detectProductType(text = '') {
  const t = text.toLowerCase();
  if (t.includes('shirt') || t.includes('tee') || t.includes('t-shirt')) return 'shirt';
  if (t.includes('mug')) return 'mug';
  if (t.includes('poster') || t.includes('print')) return 'poster';
  if (t.includes('sticker')) return 'sticker';
  if (t.includes('card')) return 'card';
  if (t.includes('tote') || t.includes('bag')) return 'tote bag';
  if (t.includes('pillow')) return 'pillow';
  if (t.includes('invitation') || t.includes('invite')) return 'invitation';
  return null;
}

function detectAudience(text = '') {
  const t = text.toLowerCase();
  if (t.includes('kid') || t.includes('child') || t.includes('baby') || t.includes('bunny') || t.includes('unicorn')) return 'kids';
  if (t.includes('mom') || t.includes('women') || t.includes('girl') || t.includes('her')) return 'women';
  if (t.includes('dad') || t.includes('men') || t.includes('boy') || t.includes('him')) return 'men';
  return 'general';
}

// ---------- TAG BUILDER - FIXED ----------
function buildTags(title) {
  const t = title.toLowerCase();
  const occasion = detectOccasion(title);
  const style = detectStyle(title);
  const product = detectProductType(title);
  const audience = detectAudience(title);

  // FIX: Extract ALL meaningful words, not just "primary"
  const STOP = new Set(['the','and','for','with','a','an','of','on','in','to','my','is','are','it']);
  const words = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w));

  const tags = new Set();

  // 1. N-GRAMS FROM TITLE - this was missing
  // 3-word windows: "happy easter colorful", "easter colorful bunny", "colorful bunny floral", "bunny floral egg"
  for (let i = 0; i < words.length - 2; i++) {
    tags.add(`${words[i]} ${words[i+1]} ${words[i+2]}`);
  }
  // 2-word windows: "happy easter", "easter colorful", "colorful bunny", "bunny floral", "floral egg"
  for (let i = 0; i < words.length - 1; i++) {
    tags.add(`${words[i]} ${words[i+1]}`);
  }

  // 2. BUYER INTENT - High converting
  if (occasion) tags.add(`${occasion} gift`);
  if (occasion && product) tags.add(`${occasion} ${product}`);
  
  if (audience === 'kids') tags.add('gift for kids');
  else if (audience === 'women') tags.add('gift for her');
  else if (audience === 'men') tags.add('gift for him');
  else tags.add('gift for her');

  // 3. PRODUCT COMBOS
  if (product) {
    // Use first 2 meaningful words + product
    const combo = words.slice(0, 2).join(' ');
    if (combo) tags.add(`${combo} ${product}`);
  }

  // 4. STYLE + OCCASION
  if (style && occasion) tags.add(`${style} ${occasion}`);
  if (style && product) tags.add(`${style} ${product}`);

  // 5. SPECIFIC HIGH-VALUE COMBOS
  if (t.includes('bunny')) {
    if (product) tags.add(`bunny ${product}`);
    if (occasion) tags.add(`${occasion} bunny`);
  }
  if (t.includes('floral') && t.includes('egg')) {
    tags.add('floral egg');
  }
  if (t.includes('easter') && t.includes('bunny')) {
    tags.add('easter bunny');
  }

  // Filter + sanitize
  let cleaned = [...tags]
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => {
      const wc = tag.split(' ').filter(Boolean).length;
      return wc >= 2 && wc <= 3 && tag.length >= 3 && tag.length <= 24;
    })
    .filter((t, i, arr) => arr.indexOf(t) === i); // dedupe

  // IP filter
  const { safe } = ipFilter(cleaned);
  cleaned = safe;

  // Sort: 3-word tags first, then 2-word
  cleaned.sort((a, b) => b.split(' ').length - a.split(' ').length);

  return cleaned.slice(0, 10);
}

// ---------- SAFE HANDLER ----------
export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false });
    }

    const { title = '' } = req.body || {};

    if (!title || title.length < 3) {
      return res.status(200).json({
        success: false,
        tags: [],
        error: 'Invalid title'
      });
    }

    let tags = buildTags(title);

    // Fallback so we never return empty
    if (tags.length === 0) {
      const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      tags = words.slice(0, 2);
      if (tags.length === 0) tags = ['gift'];
    }

    return res.status(200).json({
      success: true,
      tags,
      count: tags.length
    });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(200).json({
      success: false,
      tags: [],
      error: 'safe-failure'
    });
  }
}
