// api/generate-tags.js — TagMaster Pro FINAL
import { checkTrademarks, filterTrademarkedTags, filterTags } from '../trademarks.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title = '', spyUrl = '' } = req.body;

    // ── VALIDATE ────────────────────────────────────────────────────────────
    if (!title &&!spyUrl) {
      return res.status(400).json({ error: 'Title or spyUrl required' });
    }

    // ── SPY MODE ─────────────────────────────────────────────────────────────
    if (spyUrl) {
      if (!spyUrl.includes('zazzle.com')) {
        return res.status(400).json({ error: 'Must be a zazzle.com URL' });
      }
      const spyResult = await scrapeCompetitorTags(spyUrl);
      return res.status(200).json({
        success: true,
        spyTags: filterTrademarkedTags(spyResult.tags),
        competitorTitle: spyResult.title,
      });
    }

    // ── TRADEMARK ALERT ──────────────────────────────────────────────────────
    const trademarkAlerts = checkTrademarks(title);

    // ── CODE LOGIC TAG GENERATION ────────────────────────────────────────────
    const rawTags = generateRawTags(title);
    const { safe, blocked } = filterTags(rawTags);

    // FIX: Fallback so we never return empty array
    let finalTags = safe.slice(0, 10);
    if (finalTags.length === 0) {
      finalTags = extractFallbackTags(title).slice(0, 10);
    }

    return res.status(200).json({
      success: true,
      tags: finalTags,
      blocked: blocked.length,
      status: blocked.length? `${blocked.length} IP risk(s) blocked` : '100% IP Safe',
      trademarkAlerts: trademarkAlerts.length? trademarkAlerts : undefined,
      tagCount: finalTags.length,
    });

  } catch (err) {
    console.error('[TagMaster Pro]', err);
    return res.status(500).json({ error: 'Tag generation failed. Please try again.' });
  }
}

// ── FALLBACK: guarantees we never return [] ──────────────────────────────────
function extractFallbackTags(title) {
  const words = title.toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter(w => w.length >= 3 &&!/^(the|and|for|with|product)$/.test(w));

  const tags = new Set();
  // Single nouns
  words.forEach(w => tags.add(w));
  // 2-word combos
  for (let i = 0; i < words.length - 1; i++) {
    tags.add(`${words[i]} ${words[i + 1]}`);
  }
  // Never empty - last resort
  if (tags.size === 0) tags.add('gift');

  return [...tags].filter(t => t.length >= 2 && t.length <= 24).slice(0, 10);
}

// ── CODE LOGIC: generateRawTags ───────────────────────────────────────────────
// FIX: Tuned ADJ_NOISE + SPAM so "easter bunny" doesn't get nuked

function generateRawTags(title) {
  // ── PARSE TITLE ──────────────────────────────────────────────────────────
  const STOP = new Set([
    'the','and','for','with','a','an','of','all','one','two',
    'in','on','at','by','to','is','are','was','be','its','my','we','you','it',
  ]);

  // FIX: Removed "happy", "colorful" from ADJ_NOISE. Those are valid buyer terms.
  // Keep only weak adjectives that hurt SEO
  const ADJ_NOISE = new Set([
    'cute','cool','great','nice','best','good','modern','minimalist','vintage',
    'retro','simple','classic','unique','trendy','beautiful','pretty','lovely',
    'awesome','amazing','perfect','special',
  ]);

  // FIX: Removed "gift", "design" from SPAM. Those convert on Zazzle.
  const SPAM = new Set([
    'custom','personalized','bespoke','handmade','print','item',
    'product','stuff','thing','sale','deal','cheap','top','promo','buy',
    'post','free','shipping','discount',
  ]);

  const words = title.toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter(w => w.length > 2 &&!STOP.has(w) &&!SPAM.has(w));

  const intentWords = words.filter(w =>!ADJ_NOISE.has(w));
  const t = title.toLowerCase();

  // ── NICHE DETECTION ──────────────────────────────────────────────────────
  const isEaster = /easter/.test(t);
  const isWedding = /(wedding|invitation|bridal|bride|engagement)/.test(t);
  const isBaby = /(baby|shower|newborn|nursery)/.test(t);
  const isBirthday = /(birthday|party|celebration)/.test(t);
  const isHoliday = /(christmas|holiday|halloween|thanksgiving|hanukkah)/.test(t);
  const isPet = /\b(dog|cat|pet|puppy|kitten)\b/.test(t);
  const isJob = /(nurse|teacher|doctor|engineer|chef|firefighter|police|dad|mom|veteran)/.test(t);
  const isApparel = /(shirt|tshirt|hoodie|tee)/.test(t);

  const tags = new Set();
  const add = (...items) => items.forEach(i => { if (i) tags.add(i.toLowerCase().trim()); });

  // ── RULE 1: N-GRAMS (core phrases from title) ────────────────────────────
  // 3-word windows
  for (let i = 0; i < words.length - 2; i++) {
    add(`${words[i]} ${words[i+1]} ${words[i+2]}`);
  }
  // 2-word windows
  for (let i = 0; i < words.length - 1; i++) {
    add(`${words[i]} ${words[i+1]}`);
  }
  // Non-adjacent pairs from intentWords
  for (let i = 0; i < intentWords.length; i++) {
    for (let j = i + 2; j < intentWords.length; j++) {
      add(`${intentWords[i]} ${intentWords[j]}`);
    }
  }

  // ── RULE 2: OCCASION POWER TAGS ──────────────────────────────────────────
  if (isEaster) {
    add('easter bunny shirt','easter egg hunt shirt','easter sunday shirt',
        'easter gift for kids','kids easter shirt','womens easter shirt',
        'easter family shirt','matching easter shirt','easter egg shirt',
        'easter bunny gift','spring easter shirt','funny easter shirt');
    // Noun combos: "bunny easter shirt", "floral easter gift"
    intentWords.filter(w =>!['easter','shirt'].includes(w)).slice(0, 3).forEach(w => {
      add(`${w} easter shirt`, `easter ${w} shirt`, `${w} easter gift`);
    });
  }

  if (isWedding) {
    add('floral wedding invitation','printable wedding invitation',
        'editable wedding invitation','wedding invitation suite',
        'elegant wedding invitation','boho wedding invitation',
        'garden wedding invitation','wedding gift','bridal shower','save the date',
        'wedding stationery','wedding decor');
  }

  if (isBaby) {
    add('baby shower invitation','printable baby shower','baby shower gift',
        'gender neutral baby','new mom gift','baby shower decor','baby gift idea');
  }

  if (isBirthday) {
    add('birthday invitation','birthday party decor','birthday gift idea',
        'birthday celebration','kids birthday party','birthday card');
  }

  if (isHoliday) {
    add('printable christmas card','editable christmas card',
        'holiday greeting card','christmas gift idea','holiday decor');
  }

  if (isPet) {
    add('pet lover gift','dog lover gift','cat lover gift',
        'funny pet gift','animal lover gift','pet owner gift');
  }

  if (isJob) {
    intentWords.filter(w => isJob).slice(0, 2).forEach(w => {
      add(`${w} appreciation gift`, `thank you ${w} gift`, `${w} gift idea`);
    });
  }

  if (isApparel &&!isEaster &&!isWedding) {
    add('graphic shirt','unisex tshirt','funny graphic tee');
  }

  // ── RULE 3: AUDIENCE TAGS ────────────────────────────────────────────────
  if (isEaster || isBirthday) {
    add('gift for kids','gift for her','gift for him');
  }

  // ── FILTER: apply all Zazzle checklist rules ─────────────────────────────
  const cleaned = [...tags].filter(tag => {
    const w = tag.split(/\s+/).filter(Boolean);
    const chars = tag.length;

    return (
      w.length >= 1 && w.length <= 3 && // 1-3 words
      chars >= 3 && chars <= 24 && // 3-24 chars
    !SPAM.has(tag) && // no spam words
    !w.every(word => STOP.has(word)) // not all stop words
    );
  });

  // Sort: 2-3 word tags first, then 1-word
  cleaned.sort((a, b) => b.split(' ').length - a.split(' ').length);

  return [...new Set(cleaned)];
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

    // Title
    const tMatch = html.match(/<title>([^<]{1,120})<\/title>/i);
    const title = tMatch? tMatch[1].replace(/\s*[\|–\-].*$/, '').trim() : '';

    // Meta keywords
    const meta = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i);
    if (meta) meta[1].split(',').forEach(t => found.add(t.trim().toLowerCase()));

    // All JSON-LD blocks
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
