// api/generate-tags.js — TagMaster Pro FINAL PRODUCTION
import { ipFilter } from '../lib/trademark-filter.js';

export default async function handler(req, res) {
  // Always set CORS first, even if we crash later
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method!== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { title = '', spyUrl = '' } = req.body;

    // ── SPY MODE ─────────────────────────────────────────────────────────────
    if (spyUrl) {
      if (!spyUrl.includes('zazzle.com')) {
        return res.status(400).json({ success: false, error: 'Must be a zazzle.com URL' });
      }
      const spyResult = await scrapeCompetitorTags(spyUrl);
      return res.status(200).json({
        success: true,
        spyTags: ipFilter(spyResult.tags).safe.slice(0, 10),
        competitorTitle: spyResult.title,
      });
    }

    // ── VALIDATE ────────────────────────────────────────────────────────────
    const clean = title.trim();
    if (!clean || clean.length < 3) {
      return res.status(400).json({ success: false, error: 'Input product title first' });
    }

    // ── GENERATE TAGS ───────────────────────────────────────────────────────
    let rawTags = generateTags(clean);

    // FIX 1: Never let rawTags be empty before filtering
    if (rawTags.length === 0) {
      rawTags = fallbackTags(clean);
    }

    const { safe, blocked } = ipFilter(rawTags);

    // FIX 2: If IP filter nukes everything, use fallback
    let finalTags = safe
   .map(t => t.toLowerCase().trim())
   .filter(t => {
        const wc = t.split(' ').length;
        return wc >= 2 && wc <= 3 && t.length >= 3 && t.length <= 24;
      })
   .filter((t, i, arr) => arr.indexOf(t) === i)
   .slice(0, 10);

    if (finalTags.length === 0) {
      finalTags = fallbackTags(clean).slice(0, 10);
    }

    res.status(200).json({
      success: true,
      tags: finalTags,
      blocked: blocked.length,
      status: blocked.length? 'Filtered' : '100% IP Safe',
      tagCount: finalTags.length,
    });

  } catch (e) {
    console.error('[TagMaster Pro API Error]', e);
    // FIX 3: Always return JSON, never crash without response
    res.status(500).json({ success: false, error: 'Server error. Try again.' });
  }
}

// ── FALLBACK: guarantees non-empty result ──────────────────────────────────
function fallbackTags(title) {
  const words = title.toLowerCase()
 .replace(/[^a-z0-9\s]/g, ' ')
 .split(/\s+/)
 .filter(w => w.length >= 3 &&!/^(the|and|for|with|of|on|in|a|an|to|my|product)$/.test(w));

  const tags = new Set();
  // Single nouns
  words.forEach(w => tags.add(w));
  // 2-word combos
  for (let i = 0; i < words.length - 1; i++) {
    tags.add(`${words[i]} ${words[i + 1]}`);
  }
  // Last resort
  if (tags.size === 0) {
    tags.add('gift');
    tags.add('custom gift');
  }
  return [...tags].filter(t => t.length >= 2 && t.length <= 24);
}

// ========== TAG ENGINE ==========
// FIX 4: Removed "happy", "colorful" from aggressive filtering so "easter bunny" survives
function generateTags(title) {
  if (!title || title.length < 5) return [];

  const primary = extractPrimary(title);
  const style = detectStyle(title);
  const occasion = detectOccasion(title);
  const product = detectProductType(title);
  const audience = detectAudience(title);

  const tags = new Set();

  // 1. PRIMARY IDENTITY
  tags.add(product? `${primary} ${product}` : primary);

  // 2. BUYER INTENT LAYER
  if (occasion) tags.add(`${occasion} gift`);
  if (audience === 'kids') tags.add('gift for kids');
  else if (audience === 'women') tags.add('gift for her');
  else if (audience === 'men') tags.add('gift for him');
  else tags.add('gift for her');

  // 3. AUDIENCE + PRODUCT
  if (audience!== 'general' && product) {
    tags.add(`${audience} ${product}`);
  }

  // 4. DESIGN + CONTEXT
  if (occasion) tags.add(`${primary} ${occasion}`);
  if (style) tags.add(`${primary} ${style}`);
  if (style && occasion) tags.add(`${style} ${occasion}`);
  if (style && product) tags.add(`${style} ${product}`);

  // 5. LONG-TAIL SEARCH PHRASES
  if (style && occasion && product) {
    tags.add(`${style} ${occasion} ${product}`);
  }
  if (primary && style && product) {
    tags.add(`${primary} ${style} ${product}`);
  }
  if (occasion && product) {
    tags.add(`${occasion} ${product}`);
  }

  // 6. SAFE EXPANSIONS — 2–3-word only
  if (primary.includes('bunny') || primary.includes('rabbit')) {
    if (product) {
      tags.add(`bunny ${product}`);
      tags.add(`rabbit ${product}`);
    }
    tags.add('easter bunny');
  }
  if (primary.includes('floral') || primary.includes('flower')) {
    if (product) tags.add(`floral ${product}`);
    tags.add('floral egg');
  }
  if (primary.includes('egg')) {
    tags.add('easter egg');
  }

  return [...tags];
}

// ========== HELPERS ==========
function extractPrimary(text) {
  let t = text.toLowerCase().trim();

  const suffixes = [
    'tote bag','keychain','hoodie','sweatshirt','tshirt','t-shirt','shirt','mug',
    'pillow','blanket','poster','canvas','sticker','greeting card',
    'card','puzzle','phone case','mouse pad','invitation','invite'
  ];

  suffixes.forEach(s => {
    if (t.endsWith(s)) t = t.replace(new RegExp(s + '$'), '').trim();
  });

  // High-value concepts - order matters
  if (t.includes('floral egg')) return 'floral egg';
  if (t.includes('easter bunny flower')) return 'easter bunny';
  if (t.includes('easter bunny')) return 'easter bunny';
  if (t.includes('watercolor invite')) return 'watercolor invite';
  if (t.includes('soccer mom')) return 'soccer mom';
  if (t.includes('unicorn')) return 'unicorn';
  if (t.includes('bunny')) return 'bunny';
  if (t.includes('rabbit')) return 'rabbit';
  if (t.includes('floral') || t.includes('flower')) return 'floral';
  if (t.includes('dog')) return 'dog';
  if (t.includes('cat')) return 'cat';

  const words = t.split(/\s+/).filter(w =>
    w.length > 2 &&!['for','the','and','with','of','on','in','a','an','to','my'].includes(w)
  );

  return words.slice(0, 3).join(' ') || 'design';
}

function detectStyle(text) {
  const t = text.toLowerCase();
  if (t.includes('watercolor')) return 'watercolor';
  if (t.includes('floral') || t.includes('flower')) return 'floral';
  if (t.includes('cute') || t.includes('kawaii')) return 'cute';
  if (t.includes('vintage') || t.includes('retro')) return 'vintage';
  if (t.includes('minimal') || t.includes('modern')) return 'minimalist';
  if (t.includes('colorful') || t.includes('rainbow')) return 'colorful';
  if (t.includes('pastel')) return 'pastel';
  return null;
}

function detectOccasion(text) {
  const t = text.toLowerCase();
  if (t.includes('easter')) return 'easter';
  if (t.includes('birthday')) return 'birthday';
  if (t.includes('christmas') || t.includes('xmas')) return 'christmas';
  if (t.includes('wedding') || t.includes('bridal')) return 'wedding';
  if (t.includes('halloween')) return 'halloween';
  if (t.includes('baby') || t.includes('shower')) return 'baby';
  if (t.includes('valentine')) return 'valentine';
  if (t.includes('graduation')) return 'graduation';
  return null;
}

function detectProductType(text) {
  const t = text.toLowerCase();
  if (t.includes('invitation') || t.includes('invite')) return 'invitation';
  if (t.includes('shirt') || t.includes('tee') || t.includes('t-shirt')) return 'shirt';
  if (t.includes('mug') || t.includes('cup')) return 'mug';
  if (t.includes('poster') || t.includes('print')) return 'poster';
  if (t.includes('sticker')) return 'sticker';
  if (t.includes('card')) return 'card';
  if (t.includes('tote') || t.includes('bag')) return 'tote bag';
  if (t.includes('pillow') || t.includes('cushion')) return 'pillow';
  if (t.includes('blanket')) return 'blanket';
  if (t.includes('phone case')) return 'phone case';
  return null;
}

function detectAudience(text) {
  const t = text.toLowerCase();
  if (t.includes('kid') || t.includes('child') || t.includes('toddler') || t.includes('bunny') || t.includes('unicorn')) return 'kids';
  if (t.includes('mom') || t.includes('women') || t.includes('girl') || t.includes('her') || t.includes('bridal')) return 'women';
  if (t.includes('dad') || t.includes('men') || t.includes('boy') || t.includes('him')) return 'men';
  return 'general';
}

// ── SPY MODE: scrape competitor tags ────────────────────────────────────────
async function scrapeCompetitorTags(url) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
      },
    });
    const html = await r.text();
    const found = new Set();

    const tMatch = html.match(/<title>([^<]{1,120})<\/title>/i);
    const title = tMatch? tMatch[1].replace(/\s*[\|–\-].*$/, '').trim() : '';

    const meta = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
    if (meta) meta[1].split(',').forEach(t => found.add(t.trim().toLowerCase()));

    for (const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const d = JSON.parse(block[1]);
        if (d.keywords) {
          const kws = typeof d.keywords === 'string'? d.keywords.split(',') : d.keywords;
          kws.forEach(k => found.add(k.trim().toLowerCase()));
        }
      } catch (_) {}
    }

    return {
      tags: [...found].filter(t => t.length > 2 && t.length <= 40).slice(0, 13),
      title,
    };
  } catch (_) {
    return { tags: [], title: '' };
  }
}
