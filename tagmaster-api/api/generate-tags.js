// ==============================
// UNIVERSAL TAG FORMULA - PRODUCTION READY
// ==============================

function isValidTag(tag) {
  if (!tag || typeof tag !== 'string') return false;
  const s = tag.toLowerCase().trim().replace(/\s+/g, ' ');
  const wc = s.split(/\s+/).filter(Boolean).length;
  return wc >= 2 && wc <= 3 && s.length >= 3 && s.length <= 24 && !s.includes('&');
}

function cleanWords(text) {
  const STOP = new Set(['the','and','for','with','a','an','of','on','in','to','my','is','are','it']);
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w));
}

function detectOccasion(t) {
  t = t.toLowerCase();
  if (t.includes('easter')) return 'easter';
  if (t.includes('birthday')) return 'birthday';
  if (t.includes('christmas')) return 'christmas';
  if (t.includes('wedding') || t.includes('bridal')) return 'wedding';
  return null;
}

function detectStyle(t) {
  t = t.toLowerCase();
  if (t.includes('watercolor')) return 'watercolor';
  if (t.includes('floral')) return 'floral';
  if (t.includes('cute')) return 'cute';
  if (t.includes('colorful')) return 'colorful';
  if (t.includes('vintage')) return 'vintage';
  return null;
}

function detectProduct(t) {
  t = t.toLowerCase();
  if (t.includes('shirt') || t.includes('tee')) return 'shirt';
  if (t.includes('mug')) return 'mug';
  if (t.includes('invitation') || t.includes('invite')) return 'invitation';
  if (t.includes('sticker')) return 'sticker';
  if (t.includes('card')) return 'card';
  return null;
}

function detectAudience(t) {
  t = t.toLowerCase();
  if (t.includes('kid') || t.includes('child') || t.includes('bunny') || t.includes('unicorn')) return 'kids';
  if (t.includes('mom') || t.includes('women') || t.includes('girl') || t.includes('her')) return 'women';
  if (t.includes('dad') || t.includes('men') || t.includes('boy') || t.includes('him')) return 'men';
  return 'general';
}

function detectPrimary(title) {
  const t = title.toLowerCase();
  if (t.includes('easter bunny')) return 'easter bunny';
  if (t.includes('floral egg')) return 'floral egg';
  if (t.includes('bunny')) return 'bunny';
  if (t.includes('floral')) return 'floral';
  const words = cleanWords(title);
  return words.slice(0, 2).join(' ') || 'design';
}

function buildTags(title) {
  const t = title.toLowerCase();
  const words = cleanWords(title);
  const primary = detectPrimary(title);
  const style = detectStyle(title);
  const occasion = detectOccasion(title);
  const product = detectProduct(title);
  const audience = detectAudience(title);
  const foundIcon = words.find(w => ['bunny','rabbit','unicorn','dog','cat','egg'].includes(w));

  const out = [];

  function addTag(tag) {
    if (!tag || typeof tag !== 'string') return false;
    const s = tag.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!isValidTag(s)) return false;
    if (out.includes(s)) return false;
    out.push(s);
    return true;
  }

  // 0. CRITICAL: N-GRAMS FROM TITLE FIRST - uses real keywords
  for (let i = 0; i < words.length - 2; i++) {
    addTag(`${words[i]} ${words[i+1]} ${words[i+2]}`);
  }
  for (let i = 0; i < words.length - 1; i++) {
    addTag(`${words[i]} ${words[i+1]}`);
  }

  // 1. PRIMARY IDENTITY
  const primaryProduct = product && isValidTag(`${primary} ${product}`) ? `${primary} ${product}` : primary;
  addTag(primaryProduct);

  // 2. BUYER-INTENT LAYER
  if (occasion) addTag(`${occasion} gift`);

  if (audience === 'kids') {
    addTag('gift for kids');
  } else if (audience === 'men') {
    addTag('gift for him');
    if (occasion) addTag(`${occasion} for him`);
  } else {
    addTag('gift for her');
    if (occasion) addTag(`${occasion} for her`);
  }

  // Ensure at least 2 gift-intent tags
  const giftCount = out.filter(x => x.includes('gift')).length;
  if (giftCount < 2) {
    addTag(audience === 'men' ? 'gift for him' : 'gift for her');
  }

  // 3. AUDIENCE + PRODUCT
  if (audience && audience !== 'general' && product) {
    addTag(`${audience} ${product}`);
  }

  // 4. SEARCH COMBOS
  if (occasion) addTag(`${primary} ${occasion}`);
  if (style) addTag(`${primary} ${style}`);
  if (style && occasion) addTag(`${style} ${occasion}`);

  // 5. LONG-TAIL
  if (style && occasion && product) addTag(`${style} ${occasion} ${product}`);
  if (style && product) addTag(`${style} ${product}`);
  if (occasion && product) addTag(`${occasion} ${product}`);

  // 6. NICHE
  if (foundIcon) {
    addTag(product ? `${foundIcon} ${product}` : foundIcon);
    if (occasion && product) addTag(`${occasion} ${foundIcon} ${product}`);
  }

  // 7. UTILITY
  if (product === 'card' || product === 'invitation') {
    addTag(`${product} design`);
    addTag(`${product} template`);
  }

  // FINALIZE: Deterministic filler if < 10
  const filler = isValidTag(primaryProduct) ? primaryProduct : `${primary} design`;
  while (out.length < 10) out.push(filler);

  // Final safety pass + trim
  const final = out
    .map(s => s.toLowerCase().trim().replace(/\s+/g, ' '))
    .filter(s => isValidTag(s))
    .slice(0, 10);

  while (final.length < 10) final.push(filler);
  return final;
}
