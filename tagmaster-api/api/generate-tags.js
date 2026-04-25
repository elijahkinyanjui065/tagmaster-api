// api/generate-tags.js — TagMaster Pro Universal Engine v2
import { checkTrademarks, filterTrademarkedTags, filterTags } from '../trademarks.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title = '', spyUrl = '' } = req.body;
    if (!title && !spyUrl) return res.status(400).json({ error: 'Title or spyUrl required' });

    if (spyUrl) {
      if (!spyUrl.includes('zazzle.com')) return res.status(400).json({ error: 'Must be a zazzle.com URL' });
      const result = await scrapeCompetitorTags(spyUrl);
      return res.status(200).json({ success: true, spyTags: filterTrademarkedTags(result.tags), competitorTitle: result.title });
    }

    const trademarkAlerts = checkTrademarks(title);
    const rawTags = buildTags(title);
    const { safe, blocked } = filterTags(rawTags);
    const finalTags = safe.slice(0, 10);

    return res.status(200).json({
      success: true, tags: finalTags, blocked: blocked.length,
      status: blocked.length ? `${blocked.length} IP risk(s) blocked` : '100% IP Safe',
      trademarkAlerts: trademarkAlerts.length ? trademarkAlerts : undefined,
      tagCount: finalTags.length,
    });

  } catch (err) {
    console.error('[TagMaster Pro]', err);
    return res.status(500).json({ error: 'Tag generation failed. Please try again.' });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// VARIABLE EXTRACTION
// ══════════════════════════════════════════════════════════════════════════════

function extractVariables(title) {
  const t = title.toLowerCase();

  const OCCASIONS = {
    'easter':       /easter/,
    'birthday':     /birthday/,
    'christmas':    /christmas|xmas/,
    'wedding':      /wedding|bridal|bride/,
    'halloween':    /halloween|spooky/,
    'thanksgiving': /thanksgiving/,
    'mothers day':  /mother'?s?\s*day/,
    'fathers day':  /father'?s?\s*day/,
    'baby shower':  /baby\s*shower/,
    'graduation':   /graduat/,
    'anniversary':  /anniversary/,
    'valentines':   /valentine/,
  };

  const PRODUCTS = {
    'shirt':      /\b(shirt|tshirt|t-shirt|tee|top)\b/,
    'mug':        /\bmug\b/,
    'poster':     /\b(poster|wall art)\b/,
    'sticker':    /\bsticker\b/,
    'hoodie':     /\bhoodie\b/,
    'hat':        /\bhat\b/,
    'tote':       /\b(tote|bag)\b/,
    'invitation': /\b(invitation|invite|stationery)\b/,
    'card':       /\bcard\b/,
    'pillow':     /\bpillow\b/,
  };

  const STYLES = {
    'floral':      /\bfloral\b/,
    'watercolor':  /\bwatercolor\b/,
    'vintage':     /\bvintage\b/,
    'minimalist':  /\bminimal(ist)?\b/,
    'colorful':    /\bcolorful\b/,
    'pastel':      /\bpastel\b/,
    'rustic':      /\brustic\b/,
    'boho':        /\bboho\b/,
    'cute':        /\bcute\b/,
    'funny':       /\bfunny\b/,
    'elegant':     /\belegant\b/,
    'modern':      /\bmodern\b/,
  };

  const AUDIENCES = {
    'kids':  /\b(kids?|child|children|toddler|baby|girl|boy)\b/,
    'women': /\b(women|woman|mom|mum|her|wife|sister|bride)\b/,
    'men':   /\b(men|man|dad|him|husband|brother|groom)\b/,
  };

  // High-value nouns — these become the primary keyword
  const ICONS = [
    'bunny','unicorn','dog','cat','butterfly','sunflower','heart','owl','fox',
    'bear','panda','elephant','lion','dragon','mermaid','dinosaur','sloth',
    'turtle','deer','wolf','eagle','bee','mushroom','daisy','rose','skull',
    'rainbow','moon','star','ghost','witch','elf','santa','reindeer',
    'retriever','labrador','dachshund','poodle','corgi','bulldog',
  ];

  let occasion = null, product = null, style = null, audience = null;
  for (const [n, r] of Object.entries(OCCASIONS)) { if (r.test(t)) { occasion = n; break; } }
  for (const [n, r] of Object.entries(PRODUCTS))  { if (r.test(t)) { product = n; break; } }
  for (const [n, r] of Object.entries(STYLES))    { if (r.test(t)) { style = n; break; } }
  for (const [n, r] of Object.entries(AUDIENCES)) { if (r.test(t)) { audience = n; break; } }

  // PRIMARY: prefer a specific icon/noun over generic word pairs
  const foundIcon = ICONS.find(ic => t.includes(ic));

  // Strip all context words to find remaining nouns
  const STRIP = new Set([
    'the','and','for','with','a','an','of','on','in','to','my','is','are','it',
    'all','one','two','at','by','was','be','this','that','from','your','happy',
    'great','nice','cool','new','best','good','funny','cute','modern','simple',
    // strip detected context
    ...(occasion ? occasion.split(' ') : []),
    ...(product  ? [product] : []),
    ...(style    ? [style]   : []),
    ...(audience ? [audience === 'kids' ? 'kids' : audience === 'women' ? 'women' : 'men'] : []),
    // common product synonyms
    'shirt','tshirt','mug','poster','card','hoodie','bag','tote','invitation',
    'pillow','sticker','hat','print','design','art','gift','lover',
    // style words already detected
    'floral','colorful','watercolor','vintage','minimalist','pastel','rustic',
    'boho','elegant','retro','classic',
    // occasion words
    'easter','christmas','birthday','wedding','halloween','thanksgiving',
    'mothers','fathers','day','baby','shower','graduation','anniversary',
    'valentine','holiday','festive','seasonal',
    // audience words
    'kids','kid','women','men','mom','dad','her','him','wife','husband',
    'girl','boy','sister','brother','bride','groom','toddler','children',
  ]);

  const leftover = t.replace(/[^a-z0-9\s]/g,' ').split(/\s+/)
    .filter(w => w.length > 2 && !STRIP.has(w));

  let primary;
  if (foundIcon) {
    // Use icon as primary — most specific and rankable
    primary = foundIcon;
  } else if (leftover.length >= 2) {
    // Two meaningful words (e.g. "golden retriever", "sage green")
    primary = `${leftover[0]} ${leftover[1]}`;
  } else if (leftover.length === 1) {
    primary = leftover[0];
  } else {
    primary = occasion || style || 'design';
  }

  return { primary, product, style, occasion, audience };
}

// ══════════════════════════════════════════════════════════════════════════════
// TAG BUILDER — 10-slot formula
// Every slot has a purpose. No n-gram noise.
// ══════════════════════════════════════════════════════════════════════════════

function buildTags(title) {
  const { primary, product, style, occasion, audience } = extractVariables(title);

  const prod = product || 'gift';
  const occ  = occasion;
  const sty  = style;
  const aud  = audience;

  const BANNED = new Set([
    'custom','personalized','bespoke','handmade','sale','deal',
    'cheap','best','top','gift idea','for product','post sale',
  ]);

  // Guard: tag must be 2-3 words, 3-24 chars, not banned
  function valid(tag) {
    if (!tag) return false;
    const s = tag.toLowerCase().trim().replace(/\s+/g,' ');
    const w = s.split(' ').filter(Boolean);
    return (
      w.length >= 2 && w.length <= 3 &&
      s.length >= 3 && s.length <= 24 &&
      !BANNED.has(s) && !w.some(word => BANNED.has(word))
    );
  }

  // Build candidate slot list — ordered by priority
  const candidates = [

    // ── SLOT 1: ANCHOR — Primary + Product (strongest SEO signal) ──────────
    `${primary} ${prod}`,

    // ── SLOT 2: OCCASION + PRODUCT — "easter shirt", "wedding invitation" ──
    occ ? `${occ} ${prod}` : `${sty || primary} ${prod}`,

    // ── SLOT 3: PERSONA — "gift for kids / her / him" ──────────────────────
    aud === 'kids'  ? 'gift for kids'  :
    aud === 'women' ? 'gift for her'   :
    aud === 'men'   ? 'gift for him'   :
    occ             ? `${occ} gift`    : `${primary} gift`,

    // ── SLOT 4: AUDIENCE + PRODUCT — "kids shirt", "women mug" ─────────────
    aud ? `${aud} ${prod}` :
    occ ? `${occ} gift`    : `${primary} design`,

    // ── SLOT 5: STYLE + PRODUCT — "floral shirt", "watercolor mug" ─────────
    sty ? `${sty} ${prod}` :
    occ ? `${primary} ${occ}` : `${primary} design`,

    // ── SLOT 6: PRIMARY + OCCASION — "bunny easter", "retriever birthday" ──
    occ ? `${primary} ${occ}` :
    sty ? `${sty} ${primary}` : `${primary} lover`,

    // ── SLOT 7: LONGTAIL — Style + Occasion + Product ───────────────────────
    sty && occ      ? `${sty} ${occ} ${prod}`     :
    sty             ? `${sty} ${primary} ${prod}`  :
    occ && aud      ? `${occ} ${aud} ${prod}`      : `${primary} lover ${prod}`,

    // ── SLOT 8: LONGTAIL — Primary + Style ──────────────────────────────────
    sty ? `${primary} ${sty}` :
    occ ? `${primary} ${occ} ${prod}` : `${primary} ${aud || 'lover'} ${prod}`,

    // ── SLOT 9: OCCASION + AUDIENCE ─────────────────────────────────────────
    occ && aud ? `${occ} ${aud} ${prod}`  :
    occ && sty ? `${sty} ${occ}`          :
    aud        ? `${aud} ${primary}`       : `${primary} ${prod} gift`,

    // ── SLOT 10: STYLE + PRIMARY — "floral bunny", "watercolor butterfly" ───
    sty ? `${sty} ${primary}` :
    occ ? `${occ} ${primary} ${prod}` : `${primary} ${prod} lover`,
  ];

  // Filter, deduplicate, keep order
  const unique = [];
  for (const c of candidates) {
    const s = c.toLowerCase().trim().replace(/\s+/g,' ');
    if (valid(s) && !unique.includes(s)) unique.push(s);
  }

  // Backfill to exactly 10 with semantically valid fallbacks
  const backfillPool = [
    `${primary} ${prod}`,
    `${occ || primary} ${prod}`,
    `${sty || 'unique'} ${primary}`,
    `${primary} ${aud || 'lover'}`,
    `${prod} gift`,
    `${occ || primary} lover`,
    `${sty || primary} gift`,
    `${primary} design`,
    `${primary} ${sty || prod}`,
    `${aud || 'unique'} ${prod}`,
  ];

  let bi = 0;
  while (unique.length < 10 && bi < 60) {
    const bf = backfillPool[bi % backfillPool.length];
    const s  = bf.toLowerCase().trim().replace(/\s+/g,' ');
    if (valid(s) && !unique.includes(s)) unique.push(s);
    bi++;
  }

  return unique.slice(0, 10);
}

// ══════════════════════════════════════════════════════════════════════════════
// SPY MODE
// ══════════════════════════════════════════════════════════════════════════════

async function scrapeCompetitorTags(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36' },
    });
    const html  = await r.text();
    const found = new Set();

    const tMatch = html.match(/<title>([^<]{1,120})<\/title>/i);
    const title  = tMatch ? tMatch[1].replace(/\s*[\|–\-].*$/, '').trim() : '';

    const meta = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
    if (meta) meta[1].split(',').forEach(t => found.add(t.trim().toLowerCase()));

    for (const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const d = JSON.parse(block[1]);
        if (d.keywords) {
          const kws = typeof d.keywords === 'string' ? d.keywords.split(',') : d.keywords;
          kws.forEach(k => found.add(k.trim().toLowerCase()));
        }
      } catch (_) {}
    }

    return {
      tags:  [...found].filter(t => t.length > 2 && t.length <= 40).slice(0, 13),
      title,
    };
  } catch (_) {
    return { tags: [], title: '' };
  }
}
