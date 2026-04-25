// ================================================
// ZAZZLE TAGMASTER API v3.2 – FULL MASTER ENGINE
// CORS FIXED + NON-ROBOTIC TAGS
// ================================================

const TRADEMARKS = [
  'disney','marvel','pokemon','nintendo','barbie','hello kitty','star wars',
  'harry potter','minecraft','fortnite','pixar','dreamworks','nickelodeon',
  'lego','superman','batman','spiderman','avengers','frozen','moana',
  'star trek','lord of the rings','dc comics','mickey','minnie'
];

function ipFilter(tags = []) {
  const blocked = [];
  const safe = tags.filter(tag => {
    if (!tag) return false;
    const t = tag.toLowerCase();
    const hit = TRADEMARKS.some(tm => t.includes(tm));
    if (hit) blocked.push(tag);
    return !hit;
  });
  return { safe, blocked };
}

function buildTags(title) {
  const raw = (title || '').toLowerCase().trim();

  function detectOccasion(text) {
    const s = text.toLowerCase();
    if (s.includes('easter')) return 'Easter';
    if (s.includes('birthday')) return 'Birthday';
    if (s.includes('christmas')) return 'Christmas';
    if (s.includes('wedding') || s.includes('bride') || s.includes('groom')) return 'Wedding';
    if (s.includes('halloween')) return 'Halloween';
    if (s.includes('graduation') || s.includes('grad')) return 'Graduation';
    if (s.includes('fathers day') || s.includes('father\'s')) return 'Fathers Day';
    if (s.includes('mothers day') || s.includes('mother\'s')) return 'Mothers Day';
    if (s.includes('baby') || s.includes('shower')) return 'Baby Shower';
    return null;
  }

  function detectStyle(text) {
    const s = text.toLowerCase();
    const styles = { watercolor: 'Watercolor', floral: 'Floral', vintage: 'Vintage', boho: 'Boho', minimalist: 'Minimalist', retro: 'Retro', sarcastic: 'Sarcastic', funny: 'Funny', cute: 'Cute', modern: 'Modern', rustic: 'Rustic', abstract: 'Abstract', geometric: 'Geometric', pastel: 'Pastel', colorful: 'Colorful', elegant: 'Elegant', whimsical: 'Whimsical' };
    for (const [key, val] of Object.entries(styles)) if (s.includes(key)) return val;
    if (s.includes('cute') || s.includes('adorable')) return 'Cute';
    if (s.includes('funny') || s.includes('sarcastic')) return 'Sarcastic';
    return 'Stylish';
  }

  function detectAudience(text) {
    const s = text.toLowerCase();
    if (s.includes('nurse') || s.includes('nurses')) return 'Nurses';
    if (s.includes('teacher') || s.includes('teachers')) return 'Teachers';
    if (s.includes('mom') || s.includes('mum') || s.includes('mothers')) return 'Moms';
    if (s.includes('dad') || s.includes('fathers')) return 'Dads';
    if (s.includes('kid') || s.includes('child') || s.includes('baby') || s.includes('toddler')) return 'Kids';
    if (s.includes('women') || s.includes('her') || s.includes('girl')) return 'Women';
    if (s.includes('men') || s.includes('him') || s.includes('boy')) return 'Men';
    if (s.includes('dog') || s.includes('cat') || s.includes('pet')) return 'Pet Lovers';
    return 'Everyone';
  }

  function detectCategory(text) {
    const s = text.toLowerCase();
    if (s.includes('card') || s.includes('invitation') || s.includes('invite') || s.includes('stationery')) return 'Stationery/Cards';
    if (s.includes('shirt') || s.includes('tee') || s.includes('t-shirt') || s.includes('hoodie')) return 'Apparel/Shirts';
    if (s.includes('mug') || s.includes('pillow') || s.includes('blanket') || s.includes('decor') || s.includes('poster')) return 'Home Decor';
    return 'Everything Else';
  }

  function isAlcoholRelated(text) {
    const s = text.toLowerCase();
    return /beer|wine|shot|flask|bar|alcohol|cocktail|whiskey|vodka|stein|coaster/.test(s);
  }

  const occasion = detectOccasion(raw);
  const style = detectStyle(raw);
  const audience = detectAudience(raw);
  const category = detectCategory(raw);
  const isKidsLocked = isAlcoholRelated(raw);

  const ICONS = ['bunny','unicorn','dog','cat','sunflower','heart','owl','fox','bear','egg','floral'];
  const foundIcon = ICONS.find(ic => raw.includes(ic)) || null;

  function extractPrimary() {
    if (occasion && foundIcon) return `${occasion} ${foundIcon}`;
    if (foundIcon) return foundIcon;
    const productWords = new Set(['shirt','tee','tshirt','mug','poster','sticker','card','tote','bag','pillow','invitation','invite','print']);
    const audienceWords = new Set(['kids','kid','children','child','women','men','mom','dad','girl','boy','her','him','baby']);
    const tokens = raw.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !['the','and','for','with','a','an','of','on','in','to','my','is','are','it','gift','custom','personalized'].includes(w));
    for (let i = 0; i < tokens.length; i++) {
      const w = tokens[i];
      if (productWords.has(w) || audienceWords.has(w)) continue;
      if (/^\d+$/.test(w)) continue;
      return w;
    }
    return occasion || tokens[0] || 'Design';
  }

  const primary = extractPrimary();

  function applyKidsLock(tag) {
    if (!isKidsLocked) return tag;
    if (/kids|children|toddler|baby|kindergarten|school/.test(tag.toLowerCase())) return `${style} Aesthetic Design`;
    return tag;
  }

  let wordCount = {};
  function canAddTag(tag) {
    const words = tag.toLowerCase().split(/\s+/);
    for (const w of words) if ((wordCount[w] || 0) >= 3) return false;
    return true;
  }
  function recordWords(tag) {
    const words = tag.toLowerCase().split(/\s+/);
    for (const w of words) wordCount[w] = (wordCount[w] || 0) + 1;
  }

  const tags = [];

  const var1 = `${primary} ${style}`;
  const var2 = `${style} ${primary}`;
  const var3 = raw.includes('colorful') ? `Colorful ${primary}` : `${primary} ${style === 'Stylish' ? 'Art' : style}`;
  [var1, var2, var3].forEach(t => {
    const clean = t.trim();
    if (tags.length < 3 && canAddTag(clean)) {
      const locked = applyKidsLock(clean);
      tags.push(locked);
      recordWords(locked);
    }
  });

  let tag4 = occasion ? `${occasion} Gift` : `${audience} Gift`;
  tag4 = applyKidsLock(tag4);
  if (canAddTag(tag4)) { tags.push(tag4); recordWords(tag4); }

  let tag5 = `Gift for ${audience}`;
  tag5 = applyKidsLock(tag5);
  if (canAddTag(tag5)) { tags.push(tag5); recordWords(tag5); }

  const long1 = `${primary} ${style} ${occasion ? occasion : audience} Gift`.trim();
  const long2 = `${style} ${primary} Design`.trim();
  [long1, long2].forEach(t => {
    if (tags.length < 7 && canAddTag(t) && t.split(' ').length <= 5) {
      const locked = applyKidsLock(t);
      tags.push(locked);
      recordWords(locked);
    }
  });

  let tag8, tag9, tag10;
  if (category === 'Stationery/Cards') {
    tag8 = `${style} ${occasion || 'Card'}`;
    tag9 = `${occasion || 'Birthday'} Stationery`;
    tag10 = `${primary} Card`;
  } else if (category === 'Apparel/Shirts') {
    tag8 = `${audience} ${primary}`;
    tag9 = `${style} Apparel`;
    tag10 = `Sarcastic ${primary} Tee`;
  } else if (category === 'Home Decor') {
    tag8 = `${style} ${primary}`;
    tag9 = `${primary} Decor`;
    tag10 = `${style} Home Gift`;
  } else {
    tag8 = `${style} ${primary}`;
    tag9 = `${primary} ${style}`;
    tag10 = `${occasion || 'Special'} Gift`;
  }

  [tag8, tag9, tag10].forEach(t => {
    const clean = t.trim();
    if (tags.length < 10 && canAddTag(clean) && clean.split(' ').length <= 5) {
      const locked = applyKidsLock(clean);
      tags.push(locked);
      recordWords(locked);
    }
  });

  let final = tags
    .map(t => t.toLowerCase().trim().replace(/[&#]/g, ''))
    .filter(t => t.length >= 2 && t.length <= 40 && t.split(' ').length <= 5);

  const filler = `${primary} ${style}`.toLowerCase().trim();
  while (final.length < 10) final.push(filler);

  return final.slice(0, 10);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { title = '' } = req.body || {};
    if (!title || title.length < 3) {
      return res.status(200).json({ success: false, tags: [], error: 'Invalid title' });
    }

    let tags = buildTags(title);
    const { safe, blocked } = ipFilter(tags);

    if (!safe || safe.length === 0) {
      const fallback = `${title.toLowerCase().split(' ').slice(0, 2).join(' ')} gift`;
      tags = Array(10).fill(fallback);
    } else {
      tags = safe;
    }

    return res.status(200).json({
      success: true,
      tags: tags.slice(0, 10),
      count: tags.length,
      trademarkAlerts: blocked.length > 0 ? blocked : undefined
    });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(200).json({ success: false, tags: [], error: 'safe-failure' });
  }
}
