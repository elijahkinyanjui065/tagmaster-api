// ---------- TAG BUILDER v3.1 – FULL MASTER ENGINE (identical to local fallback) ----------
function buildTags(title) {
  const raw = (title || '').toLowerCase().trim();

  // ── PHASE 0: MANDATORY PRODUCT ANALYSIS ─────────────────────────────────────
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
    const styles = {
      watercolor: 'Watercolor', floral: 'Floral', vintage: 'Vintage',
      boho: 'Boho', minimalist: 'Minimalist', retro: 'Retro',
      sarcastic: 'Sarcastic', funny: 'Funny', cute: 'Cute',
      modern: 'Modern', rustic: 'Rustic', abstract: 'Abstract',
      geometric: 'Geometric', pastel: 'Pastel', colorful: 'Colorful',
      elegant: 'Elegant', whimsical: 'Whimsical'
    };
    for (const [key, val] of Object.entries(styles)) {
      if (s.includes(key)) return val;
    }
    // fallback creative style from adjectives
    if (s.includes('cute') || s.includes('adorable')) return 'Cute';
    if (s.includes('funny') || s.includes('sarcastic')) return 'Sarcastic';
    return 'Stylish'; // safe non-generic fallback
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

  // Extract Primary Subject (smart – first meaningful descriptive phrase)
  const STOP = new Set(['the','and','for','with','a','an','of','on','in','to','my','is','are','it','gift','custom','personalized']);
  const tokens = raw.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  let primary = tokens.slice(0, 3).join(' '); // up to 3-word primary
  if (occasion && tokens.includes(occasion.toLowerCase())) primary = occasion + ' ' + primary;
  if (!primary) primary = 'Design';

  // ── KIDS SAFETY LOCK ───────────────────────────────────────────────────────
  function applyKidsLock(tag) {
    if (!isKidsLocked) return tag;
    const lower = tag.toLowerCase();
    if (/kids|children|toddler|baby|kindergarten|school/.test(lower)) {
      return `${style} Aesthetic Design`;
    }
    return tag;
  }

  // ── WORD REPETITION GUARD (no word >3 times total) ───────────────────────
  let wordCount = {};
  function canAddTag(tag) {
    const words = tag.toLowerCase().split(/\s+/);
    for (const w of words) {
      if ((wordCount[w] || 0) >= 3) return false;
    }
    return true;
  }
  function recordWords(tag) {
    const words = tag.toLowerCase().split(/\s+/);
    for (const w of words) wordCount[w] = (wordCount[w] || 0) + 1;
  }

  // ── BUILD TAGS – EXACT v3.1 SEQUENCE ───────────────────────────────────────
  const tags = [];

  // Phase 1: SEO Foundation (Tags 1–3) – synonym-style variations
  const var1 = `${primary} ${style}`;
  const var2 = `${style} ${primary}`;
  const var3 = `${primary} ${style === 'Stylish' ? 'Art' : style}`;
  [var1, var2, var3].forEach(t => {
    const clean = t.trim();
    if (tags.length < 3 && canAddTag(clean)) {
      const locked = applyKidsLock(clean);
      tags.push(locked);
      recordWords(locked);
    }
  });

  // Phase 2: Intent & Persona (Tags 4–5)
  let tag4 = occasion ? `${occasion} Gift` : `${audience} Gift`;
  tag4 = applyKidsLock(tag4);
  if (canAddTag(tag4)) { tags.push(tag4); recordWords(tag4); }

  let tag5 = `Gift for ${audience}`;
  tag5 = applyKidsLock(tag5);
  if (canAddTag(tag5)) { tags.push(tag5); recordWords(tag5); }

  // Phase 3: Long-Tail Phrases (Tags 6–7) – 3–5 word natural phrases
  const long1 = `${primary} ${style} ${occasion ? occasion : audience} Gift`.trim();
  const long2 = `${style} ${primary} Design Gift`.trim();
  [long1, long2].forEach(t => {
    if (tags.length < 7 && canAddTag(t)) {
      const locked = applyKidsLock(t);
      tags.push(locked);
      recordWords(locked);
    }
  });

  // Phase 4: Dynamic Mix (Tags 8–10) – Category-weighted
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
    if (tags.length < 10 && canAddTag(clean)) {
      const locked = applyKidsLock(clean);
      tags.push(locked);
      recordWords(locked);
    }
  });

  // Final enforcement – exactly 10 tags, max 5 words, sanitized
  let final = tags
    .map(t => t.toLowerCase().trim().replace(/[&#]/g, ''))
    .filter(t => t.length >= 2 && t.length <= 40 && t.split(' ').length <= 5);

  // Dedupe + fill if needed (using safe primary variation)
  const filler = `${primary} ${style}`.toLowerCase().trim();
  while (final.length < 10) final.push(filler);

  return final.slice(0, 10);
}
