/* /api/generate-tags.js — THE SALES ENGINE BLUEPRINT */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { title = '' } = req.body;
    const cleanTitle = (title || '').trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      return res.status(400).json({ success: false, error: 'Input product title first' });
    }

    // BREAKDOWN SIGNALS (The Foundation)
    const signals = interpretProductSignals(cleanTitle);
    
    // GENERATE HIERARCHY (The Sales Engine)
    const { tags, blocked } = generateHierarchicalTags(signals, cleanTitle);

    res.status(200).json({
      success: true,
      tags,
      blocked: blocked.length,
      status: '100% SEO Optimized'
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

/* ── SIGNAL INTERPRETATION ────────────────────────────────────────────────── */

function interpretProductSignals(title) {
  const t = title.toLowerCase();
  return {
    occasion: detectOccasion(t) || "special-occasion",
    type: detectType(t) || "custom-gift",
    style: detectStyle(t) || "modern-design",
    visual: detectVisual(t) || "unique-aesthetic",
    audience: detectAudience(t)
  };
}

/* ── THE 10-TAG HIERARCHY ────────────────────────────────────────────────── */

function generateHierarchicalTags(s, title) {
  const tags = [];
  const used = new Set();

  function addTag(tag) {
    if (!tag) return;
    const formatted = tag.toLowerCase().trim();
    const words = formatted.split(/\s+/).filter(Boolean);
    // STRICTOR RULES: No 1-word, no duplicates, max 10
    if (words.length >= 2 && !used.has(formatted) && tags.length < 10) {
      tags.push(formatted);
      used.add(formatted);
    }
  }

  // 1-3: CORE 3-WORD PHRASES (Ranking Weight)
  addTag(`${s.style} ${s.occasion} ${s.type}`);
  addTag(`${s.visual} ${s.style} ${s.type}`);
  addTag(`${s.occasion} ${s.type} design`);

  // 4-5: BUYER INTENT (Conversion Drivers)
  const intentMap = {
    wedding: ['gift for bride', 'wedding party favor'],
    baby: ['new baby gift', 'baby shower present'],
    christmas: ['holiday gift idea', 'christmas stocking stuffer'],
    birthday: ['birthday party gift', 'personalized birthday present'],
    'special-occasion': ['unique gift idea', 'personalized keepsake']
  };
  const intents = intentMap[s.occasion] || intentMap['special-occasion'];
  addTag(intents[0]);
  addTag(intents[1]);

  // 6-7: OCCASION & CONTEXT (Broad Reach)
  addTag(`${s.occasion} ${s.type}`);
  addTag(`${s.audience} ${s.occasion} gift`);

  // 8-9: STYLE & VISUAL DIVERSITY (Discovery)
  addTag(`${s.style} artwork style`);
  addTag(`${s.visual} themed design`);

  // 10: SPECIFIC DETAIL ANCHOR (Theme/Color)
  addTag(`${s.visual} color palette`);

  // IP FILTER & EMERGENCY EXPANSION
  let { safe, blocked } = ipFilter(tags);

  // If we lack tags, intelligently expand into adjacent search spaces, NOT fillers
  const neighbors = [`${s.style} aesthetic`, `${s.occasion} celebration`, `custom ${s.type} art`];
  let i = 0;
  while (safe.length < 10 && i < neighbors.length) {
    addTag(neighbors[i]);
    i++;
    ({ safe, blocked } = ipFilter(tags));
  }

  return { tags: safe, blocked };
}

/* ── REFINED DETECTORS ────────────────────────────────────────────────────── */

function detectType(t) {
  if (t.includes('invitation') || t.includes('card')) return 'invitation';
  if (t.includes('shirt') || t.includes('tee')) return 'apparel shirt';
  if (t.includes('mug')) return 'coffee mug';
  if (t.includes('pillow')) return 'throw pillow';
  return null;
}

function detectOccasion(t) {
  if (t.includes('wedding')) return 'wedding';
  if (t.includes('baby') || t.includes('shower')) return 'baby shower';
  if (t.includes('christmas') || t.includes('holiday')) return 'christmas';
  if (t.includes('birthday')) return 'birthday';
  return null;
}

function detectStyle(t) {
  if (t.includes('floral') || t.includes('botanical')) return 'floral';
  if (t.includes('minimalist') || t.includes('simple')) return 'minimalist';
  if (t.includes('vintage') || t.includes('retro')) return 'vintage';
  if (t.includes('watercolor')) return 'watercolor';
  return 'artistic';
}

function detectVisual(t) {
  const colors = ['rose', 'pink', 'blue', 'gold', 'green', 'black'];
  const foundColor = colors.find(c => t.includes(c));
  if (foundColor) return foundColor;
  if (t.includes('nature')) return 'nature inspired';
  if (t.includes('modern')) return 'modern sleek';
  return 'handcrafted';
}

function detectAudience(t) {
  if (t.includes('bride') || t.includes('her') || t.includes('mom')) return 'women';
  if (t.includes('groom') || t.includes('him') || t.includes('dad')) return 'men';
  return 'unisex';
}

function ipFilter(tags) {
  const TRADEMARKS = ['disney','marvel','pokemon','nintendo','barbie'];
  const blocked = [];
  const safe = tags.filter(tag => {
    const hit = TRADEMARKS.find(tm => tag.toLowerCase().includes(tm));
    if (hit) blocked.push({ tag, reason: hit });
    return !hit;
  });
  return { safe, blocked };
}
