// api/generate-tags.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method!== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { title = '', spyUrl = '' } = req.body;

    // Handle spy requests
    if (spyUrl) {
      // Add your spy logic here if needed, or return empty
      return res.status(200).json({ success: true, tags: [], spyTags: [] });
    }

    const clean = title.trim();
    if (!clean || clean.length < 3) {
      return res.status(400).json({ success: false, error: 'Input product title first' });
    }

    const { tags, blocked } = generateSecretSauceTags(clean);

    res.status(200).json({
      success: true,
      tags,
      blocked: blocked.length,
      status: blocked.length? 'Filtered' : '100% IP Safe'
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

function generateSecretSauceTags(title) {
  const raw = title.toLowerCase().trim();
  const occasion = detectOccasion(raw);
  const style = detectStyle(raw);
  const audience = detectAudience(raw);
  const primary = extractPrimary(raw, occasion);
  const isKidsLocked = isAlcoholRelated(raw);

  const tags = [];
  const usedWords = {};

  function canUseWord(word) {
    return (usedWords[word] || 0) < 3;
  }
  function recordWords(tag) {
    tag.split(' ').forEach(w => usedWords[w] = (usedWords[w] || 0) + 1);
  }
  function applyKidsLock(tag) {
    if (!isKidsLocked) return tag;
    if (/kids|children|toddler|baby|kindergarten|school/i.test(tag)) return `${style} design`;
    return tag;
  }

  // TAGS 1-3: SEO Foundation — natural phrases, no hyphens
  const seo1 = primary;
  const seo2 = style? `${primary} ${style}` : `${primary} gift`;
  const seo3 = occasion? `${primary} ${occasion}` : `unique ${primary}`;
  [seo1, seo2, seo3].forEach(t => {
    const clean = t.trim();
    if (canUseWord(clean.split(' ')[0])) {
      tags.push(clean);
      recordWords(clean);
    }
  });

  // TAGS 4-5: Intent Tags — buyer focused
  let tag4 = occasion? `${occasion} gift` : `${primary} gift`;
  tag4 = applyKidsLock(tag4);
  tags.push(tag4);
  recordWords(tag4);

  let tag5;
  if (isKidsLocked) tag5 = `${style} gift`;
  else if (audience === 'kids') tag5 = 'gift for kids';
  else if (audience === 'women') tag5 = 'gift for her';
  else if (audience === 'men') tag5 = 'gift for him';
  else tag5 = `${style} gift`;
  tag5 = applyKidsLock(tag5);
  tags.push(tag5);
  recordWords(tag5);

  // TAGS 6-7: Long-Tail search phrases
  const long1 = style && occasion? `${style} ${primary} ${occasion}` : `${primary} ${style} design`;
  const long2 = occasion? `${occasion} ${style} gift` : `${primary} ${style} art`;
  [long1, long2].forEach(t => {
    if (tags.length < 7) {
      tags.push(t);
      recordWords(t);
    }
  });

  // TAGS 8-10: Category Mix — natural phrases
  const category = detectCategory(raw);
  let tag8, tag9, tag10;

  if (category === 'Stationery/Cards') {
    tag8 = style && occasion? `${style} ${occasion}` : `${style} card`;
    tag9 = occasion? `${occasion} stationery` : `${occasion} card`;
    tag10 = `${primary} card`;
  } else if (category === 'Apparel/Shirts') {
    tag8 = audience!== 'general'? `${audience} ${primary}` : `${style} ${primary}`;
    tag9 = `${style} apparel`;
    tag10 = `funny ${primary} design`;
  } else if (category === 'Home Decor') {
    tag8 = `${style} ${primary}`;
    tag9 = `${primary} decor`;
    tag10 = `${style} home gift`;
  } else {
    tag8 = style && occasion? `${style} ${occasion}` : `${style} ${primary}`;
    tag9 = `${primary} ${style}`;
    tag10 = occasion? `${occasion} gift` : `${occasion} decor`;
  }

  [tag8, tag9, tag10].forEach(t => {
    if (tags.length < 10) tags.push(t);
  });

  // FINAL: No hyphens, 2-4 words, clean
  let final = tags
.map(t => t.toLowerCase().trim().replace(/[&#]/g, '')) // Keep spaces, no hyphen replacement
.filter(t => {
      const wordCount = t.split(' ').length;
      return wordCount >= 2 && wordCount <= 4 && t.length <= 40;
    })
.filter((t, i, arr) => arr.indexOf(t) === i)
.slice(0, 10);

  const { safe, blocked } = ipFilter(final);

  // Guarantee 10 tags — natural 2-word fillers
  while (safe.length < 10) {
    safe.push(`${primary} ${style}`.toLowerCase());
  }

  return { tags: safe.slice(0, 10), blocked };
}

function ipFilter(tags) {
  const TRADEMARKS = ['disney','marvel','pokemon','nintendo','barbie','hello kitty','star wars','harry potter','minecraft','fortnite','pixar','dreamworks','nickelodeon','lego','superman','batman','spiderman','avengers','frozen','moana'];
  const blocked = [];
  const safe = tags.filter(tag => {
    const t = tag.toLowerCase();
    const hit = TRADEMARKS.find(tm => t.includes(tm));
    if (hit) blocked.push({ tag, reason: hit });
    return!hit;
  });
  return { safe, blocked };
}

function extractPrimary(text, occasion) {
  let t = text.toLowerCase();
  const suffixes = ['tote bag','keychain','hoodie','sweatshirt','tshirt','t-shirt','shirt','mug','pillow','blanket','poster','canvas','sticker','greeting card','card','puzzle','phone case','mouse pad','invitation','invite','print'];
  suffixes.forEach(s => {
    if (t.endsWith(s)) t = t.replace(new RegExp(s + '$'), '').trim();
  });

  if (t.includes('easter bunny')) return 'easter bunny';
  if (t.includes('cat dad')) return 'cat dad';
  if (t.includes('floral egg')) return 'floral egg';
  if (t.includes('soccer mom')) return 'soccer mom';

  const tokens = t.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w =>
    w.length > 2 &&!['for','the','and','with','of','on','in','a','an','to','my','is','are','it','gift','custom','personalized','sale','cheap'].includes(w)
  );

  if (occasion && tokens.includes(occasion.toLowerCase())) {
    const filtered = tokens.filter(w => w!== occasion.toLowerCase());
    if (filtered.length) return `${occasion} ${filtered[0]}`;
  }

  return tokens.slice(0, 2).join(' ') || 'design';
}

function detectStyle(text) {
  const t = text.toLowerCase();
  const styles = { watercolor:'Watercolor', floral:'Floral', vintage:'Vintage', boho:'Boho', minimalist:'Minimalist', retro:'Retro', sarcastic:'Sarcastic', funny:'Funny', cute:'Cute', modern:'Modern', rustic:'Rustic', abstract:'Abstract', geometric:'Geometric', pastel:'Pastel', colorful:'Colorful', elegant:'Elegant', whimsical:'Whimsical' };
  for (const [key, val] of Object.entries(styles)) if (t.includes(key)) return val;
  if (t.includes('cute') || t.includes('adorable')) return 'Cute';
  if (t.includes('funny') || t.includes('sarcastic')) return 'Sarcastic';
  return 'Stylish';
}

function detectOccasion(text) {
  const t = text.toLowerCase();
  if (t.includes('easter')) return 'Easter';
  if (t.includes('birthday')) return 'Birthday';
  if (t.includes('christmas') || t.includes('xmas')) return 'Christmas';
  if (t.includes('wedding') || t.includes('bride') || t.includes('groom')) return 'Wedding';
  if (t.includes('halloween')) return 'Halloween';
  if (t.includes('graduation')) return 'Graduation';
  if (t.includes('fathers day') || t.includes("father's")) return 'Fathers Day';
  if (t.includes('mothers day') || t.includes("mother's")) return 'Mothers Day';
  if (t.includes('baby') || t.includes('shower')) return 'Baby Shower';
  if (t.includes('valentine')) return 'Valentine';
  return null;
}

function detectCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('card') || t.includes('invitation') || t.includes('stationery')) return 'Stationery/Cards';
  if (t.includes('shirt') || t.includes('tee') || t.includes('hoodie')) return 'Apparel/Shirts';
  if (t.includes('mug') || t.includes('pillow') || t.includes('decor') || t.includes('poster') || t.includes('canvas')) return 'Home Decor';
  return 'Everything Else';
}

function detectAudience(text) {
  const t = text.toLowerCase();
  if (t.includes('kid') || t.includes('child') || t.includes('toddler') || t.includes('baby')) return 'kids';
  if (t.includes('mom') || t.includes('women') || t.includes('girl') || t.includes('her') || t.includes('bride')) return 'women';
  if (t.includes('dad') || t.includes('men') || t.includes('boy') || t.includes('him') || t.includes('groom')) return 'men';
  return 'general';
}

function isAlcoholRelated(text) {
  return /beer|wine|shot|flask|bar|alcohol|cocktail|whiskey|vodka|stein|coaster/.test(text.toLowerCase());
}
