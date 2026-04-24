export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  try {
    const { title = '' } = req.body || {};
    if (!title || title.length < 3) {
      return res.status(200).json({ success: false, tags: [] });
    }

    const tags = buildTags(title);
    return res.status(200).json({ success: true, tags });

  } catch (err) {
    return res.status(200).json({ success: false, tags: [] });
  }
}

// ---------- YOUR UNIVERSAL TAG FORMULA - FIXED ----------
function isValidTag(tag) {
  if (!tag || typeof tag !== 'string') return false;
  const s = tag.toLowerCase().trim().replace(/\s+/g, ' ');
  const wc = s.split(/\s+/).filter(Boolean).length;
  return wc >= 2 && wc <= 3 && s.length >= 3 && s.length <= 24;
}

function cleanWords(text) {
  const STOP = new Set(['the','and','for','with','a','an','of','on','in','to','my','is','are']);
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
}

function buildTags(title) {
  const t = title.toLowerCase();
  const words = cleanWords(title);
  
  // Define ALL variables your formula needs
  const product = t.includes('shirt') ? 'shirt' : t.includes('mug') ? 'mug' : t.includes('card') ? 'card' : null;
  const occasion = t.includes('easter') ? 'easter' : t.includes('birthday') ? 'birthday' : t.includes('christmas') ? 'christmas' : null;
  const style = t.includes('floral') ? 'floral' : t.includes('colorful') ? 'colorful' : null;
  const audience = t.includes('kid') || t.includes('bunny') ? 'kids' : t.includes('mom') || t.includes('her') ? 'women' : 'general';
  const primary = words.slice(0, 2).join(' ') || 'design';
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

  // 1. PRIMARY IDENTITY
  const primaryProduct = product && isValidTag(`${primary} ${product}`) ? `${primary} ${product}` : `${primary} design`;
  addTag(primaryProduct);

  // 2. BUYER-INTENT LAYER
  if (occasion) addTag(`${occasion} gift`);

  if (audience === 'kids') {
    addTag('gift for kids');
  } else if (audience === 'men') {
    addTag('gift for him');
    if (occasion) addTag(`${occasion} for him`);
  } else if (audience === 'women') {
    addTag('gift for her');
    if (occasion) addTag(`${occasion} for her`);
  } else {
    addTag('gift for him');
  }

  if (out.filter(x => x.includes('gift')).length < 2) {
    addTag(audience === 'women' ? 'gift for her' : 'gift for him');
  }

  // 3. AUDIENCE + PRODUCT
  if (audience !== 'general' && product) addTag(`${audience} ${product}`);

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
    if (t.includes('gift') || t.includes('her') || t.includes('him')) {
      addTag(audience === 'women' ? 'gift for her' : 'gift for him');
    }
  }

  // FINALIZE: Backfill to 10
  const filler = isValidTag(primaryProduct) ? primaryProduct : `${primary} design`;
  while (out.length < 10) out.push(filler);

  const final = out
    .map(s => s.toLowerCase().trim().replace(/\s+/g, ' '))
    .filter(s => isValidTag(s))
    .slice(0, 10);

  while (final.length < 10) final.push(filler);
  return final;
}
