// ==============================
// Zazzle Tags Master — CORS SAFE BUILD (NO IMPORTS)
// Prevents Vercel crash BEFORE headers
// ==============================

// ---------- TRADEMARK FILTER (INLINE — NO IMPORTS) ----------
const TRADEMARKS = [
  'disney','marvel','pokemon','nintendo','barbie','hello kitty','star wars',
  'harry potter','minecraft','fortnite','pixar','dreamworks','nickelodeon',
  'lego','superman','batman','spiderman','avengers','frozen','moana',
  'star trek','lord of the rings','dc comics','mickey','minnie'
];

function ipFilter(tags = []) {
  try {
    return tags.filter(tag => {
      if (!tag) return false;
      const t = tag.toLowerCase();
      if (t.length < 3) return false;
      return !TRADEMARKS.some(tm => t.includes(tm));
    });
  } catch (e) {
    return [];
  }
}

// ---------- SAFE DETECTION ----------
function extractPrimary(text = '') {
  let t = text.toLowerCase().trim();

  const suffixes = [
    'tote bag','keychain','hoodie','sweatshirt','tshirt','shirt','mug',
    'pillow','blanket','poster','canvas','sticker','greeting card',
    'card','puzzle','phone case','mouse pad'
  ];

  suffixes.forEach(s => {
    if (t.endsWith(s)) {
      t = t.replace(new RegExp(s + '$'), '').trim();
    }
  });

  if (t.includes('easter bunny') || t.includes('bunny')) return 'easter bunny';
  if (t.includes('rabbit')) return 'rabbit';
  if (t.includes('floral') || t.includes('flower')) return 'floral';
  if (t.includes('dog')) return 'dog';
  if (t.includes('cat')) return 'cat';

  const words = t.split(/\s+/).filter(w =>
    w.length > 2 && !['for','the','and','with','of','on','in','a','an'].includes(w)
  );

  return words.slice(0, 3).join(' ') || 'design';
}

function detectOccasion(text = '') {
  const t = text.toLowerCase();
  if (t.includes('easter')) return 'easter';
  if (t.includes('birthday')) return 'birthday';
  if (t.includes('christmas')) return 'christmas';
  if (t.includes('wedding')) return 'wedding';
  return null;
}

function detectStyle(text = '') {
  const t = text.toLowerCase();
  if (t.includes('watercolor')) return 'watercolor';
  if (t.includes('floral')) return 'floral';
  if (t.includes('cute')) return 'cute';
  if (t.includes('vintage')) return 'vintage';
  if (t.includes('minimal')) return 'minimalist';
  return null;
}

function detectProductType(text = '') {
  const t = text.toLowerCase();
  if (t.includes('shirt') || t.includes('tee')) return 'tshirt';
  if (t.includes('mug')) return 'mug';
  if (t.includes('poster')) return 'poster';
  if (t.includes('sticker')) return 'sticker';
  if (t.includes('card')) return 'card';
  return null;
}

function detectAudience(text = '') {
  const t = text.toLowerCase();
  if (t.includes('kid') || t.includes('child') || t.includes('baby')) return 'kids';
  if (t.includes('mom') || t.includes('woman') || t.includes('girl')) return 'women';
  if (t.includes('dad') || t.includes('man') || t.includes('boy')) return 'men';
  return 'general';
}

// ---------- TAG BUILDER ----------
function buildTags(title) {
  const primary = extractPrimary(title);
  const style = detectStyle(title);
  const occasion = detectOccasion(title);
  const product = detectProductType(title);
  const audience = detectAudience(title);

  const tags = new Set();

  // Primary
  tags.add(product ? `${primary} ${product}` : primary);

  // Intent
  if (occasion) tags.add(`${occasion} gift`);
  tags.add(
    audience === 'kids' ? 'gift for kids' :
    audience === 'women' ? 'gift for her' :
    audience === 'men' ? 'gift for him' :
    'gift for her'
  );

  // Audience + product
  if (audience !== 'general' && product) {
    tags.add(`${audience} ${product}`);
  }

  // Design combos
  if (occasion) tags.add(`${primary} ${occasion}`);
  if (style) tags.add(`${primary} ${style}`);
  if (style && product) tags.add(`${style} ${product}`);

  // Long-tail
  if (style && occasion && product) {
    tags.add(`${style} ${occasion} ${product}`);
  }

  if (primary.includes('bunny')) {
    tags.add('bunny');
    tags.add('rabbit');
  }

  const cleaned = ipFilter([...tags]);

  return cleaned.slice(0, 10);
}

// ---------- SAFE HANDLER (NO CORS FAIL POINTS) ----------
export default async function handler(req, res) {
  try {
    // ALWAYS set headers first (prevents CORS death)
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

    if (!title || title.length < 5) {
      return res.status(200).json({
        success: false,
        tags: [],
        error: 'Invalid title'
      });
    }

    const tags = buildTags(title);

    return res.status(200).json({
      success: true,
      tags,
      count: tags.length,
      firstTag: tags[0] || ''
    });

  } catch (err) {
    // NEVER crash without response (prevents CORS phantom error)
    return res.status(200).json({
      success: false,
      tags: [],
      error: 'safe-failure'
    });
  }
}
