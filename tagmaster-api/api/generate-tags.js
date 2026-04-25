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
  if (t.includes('shirt') || t.includes('tee') || t.includes('t-shirt')) return 'tshirt';
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

// ---------- TAG BUILDER - REWRITTEN ----------
function buildTags(title) {
  const raw = (title || '').toLowerCase().trim();
  const occasion = detectOccasion(title);
  const style = detectStyle(title);
  const product = detectProductType(title) || 'design';
  const audience = detectAudience(title);

  // Deterministic stopwords and bad tokens
  const STOP = new Set([
    'the','and','for','with','a','an','of','on','in','to','my','is','are','it',
    'personalized','personalise','custom','customized','name','your','by','from',
    'sale','discount','cheap','free'
  ]);

  // Icons / niche tokens we treat specially
  const ICONS = ['bunny','unicorn','dog','cat','sunflower','heart','owl','fox','bear'];

  // Banned phrases (spam)
  const BANNED_PHRASES = [
    'post sale','for product','gift idea','cheap deal','personalized','custom'
  ];

  // Tokenize title into meaningful words
  const tokens = raw
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && w.length > 2 && !STOP.has(w));

  // Helper: find first icon in title
  const foundIcon = ICONS.find(ic => raw.includes(ic)) || null;

  // Helper: extract a strong "primary" keyword or phrase
  function extractPrimary() {
    // Prefer occasion + icon (e.g., "easter bunny")
    if (occasion && foundIcon) return `${occasion} ${foundIcon}`;

    // Prefer first icon if present
    if (foundIcon) return foundIcon;

    // Prefer first token that is not a product or audience word
    const productWords = new Set(['shirt','tshirt','tee','mug','poster','sticker','card','tote','bag','pillow','invitation','invite','print']);
    const audienceWords = new Set(['kids','kid','children','child','women','men','mom','dad','girl','boy','her','him','baby']);
    for (let i = 0; i < tokens.length; i++) {
      const w = tokens[i];
      if (productWords.has(w) || audienceWords.has(w)) continue;
      // Avoid numeric-only tokens
      if (/^\d+$/.test(w)) continue;
      return w;
    }

    // Fallback: use occasion if present
    if (occasion) return occasion;

    // Fallback: use first token or 'design'
    return tokens[0] || 'design';
  }

  const primary = extractPrimary();

  // Helper: validate tag against constraints
  function isValidTag(tag) {
    if (!tag || typeof tag !== 'string') return false;
    const t = tag.toLowerCase().trim();
    // no banned phrases
    if (BANNED_PHRASES.some(bp => t.includes(bp))) return false;
    // no trademark substrings
    if (TRADEMARKS.some(tm => t.includes(tm))) return false;
    const words = t.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 3) return false; // enforce 2-3 words
    if (t.length < 3 || t.length > 24) return false; // enforce length
    // no single-word tokens inside (already checked), ensure no broken splits like 'gift for her' -> allowed as phrase but we avoid splitting elsewhere
    return true;
  }

  // Build tags in fixed deterministic order per spec
  const out = [];

  // 1. PRIMARY (primary + product) -> tag #1
  const primaryProduct = `${primary} ${product}`.replace(/\s+/g, ' ').trim();
  if (isValidTag(primaryProduct)) out.push(primaryProduct);

  // 2. GIFT-INTENT (always 2 tags)
  // 2a: occasion gift (if occasion) else primary gift
  const occasionGift = occasion ? `${occasion} gift` : `${primary} gift`;
  if (isValidTag(occasionGift)) out.push(occasionGift);

  // 2b: audience gift (deterministic)
  let audienceGift = 'gift for her';
  if (audience === 'kids') audienceGift = 'gift for kids';
  else if (audience === 'women') audienceGift = 'gift for her';
  else if (audience === 'men') audienceGift = 'gift for him';
  if (isValidTag(audienceGift)) out.push(audienceGift);

  // 3. AUDIENCE + PRODUCT (1 tag if audience exists and not general)
  if (audience && audience !== 'general') {
    const audProd = `${audience} ${product}`;
    if (isValidTag(audProd)) out.push(audProd);
  }

  // 4. SEARCH COMBOS (2 tags)
  // primary + occasion
  if (occasion) {
    const pOcc = `${primary} ${occasion}`;
    if (isValidTag(pOcc)) out.push(pOcc);
  }
  // primary + style
  if (style) {
    const pStyle = `${primary} ${style}`;
    if (isValidTag(pStyle)) out.push(pStyle);
  }

  // 5. LONG-TAIL (2 tags)
  if (style && occasion && product) {
    const long1 = `${style} ${occasion} ${product}`;
    if (isValidTag(long1)) out.push(long1);
  }
  if (style && product) {
    const long2 = `${style} ${product}`;
    if (isValidTag(long2)) out.push(long2);
  }

  // 6. NICHE-EXTRA (1 tag max)
  if (foundIcon) {
    const niche = product ? `${foundIcon} ${product}` : `${foundIcon} design`;
    if (isValidTag(niche)) out.push(niche);
  }

  // Deduplicate while preserving order
  const deduped = [];
  const seen = new Set();
  for (const t of out) {
    const s = (t || '').toLowerCase().trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    deduped.push(s);
  }

  // IP filter (remove trademarked tags)
  const { safe } = ipFilter(deduped);
  let final = safe.slice(); // copy

  // Ensure we have exactly 10 tags: backfill deterministically with primaryProduct
  const filler = primaryProduct && isValidTag(primaryProduct) ? primaryProduct : `${primary} design`;
  while (final.length < 10) {
    // Only add filler if it passes validation and isn't already present more than necessary
    final.push(filler);
  }

  // Final pass: enforce constraints and trim to 10
  final = final
    .map(t => t.toLowerCase().trim())
    .filter((t, i, arr) => {
      // enforce constraints again
      if (!isValidTag(t)) return false;
      // avoid duplicates beyond necessary: allow repeated filler but keep deterministic order
      return true;
    })
    .slice(0, 10);

  // If somehow we lost tags due to filtering, force-fill with deterministic safe fallback
  while (final.length < 10) {
    final.push(filler);
  }

  return final;
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

    // Fallback so we never return empty (shouldn't happen with new builder)
    if (!tags || tags.length === 0) {
      const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const fallback = (words.slice(0, 2).join(' ') || 'gift for her');
      tags = Array(10).fill(fallback).slice(0, 10);
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
