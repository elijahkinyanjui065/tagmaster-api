/* /api/generate-tags.js — SEARCH QUERY SIMULATOR v3.2 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { title = '', product } = req.body;
    const cleanTitle = (title || '').trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      return res.status(400).json({ success: false, error: 'Input product title first' });
    }

    if (!product) {
      return res.status(400).json({ success: false, error: 'Product type required - add to title (shirt, mug, card, etc.)' });
    }

    // LOCKED PRODUCT PIPELINE — NO RE-DETECTION
    const signals = {
      product: product.toLowerCase(),
      occasion: detectOccasion(cleanTitle),
      recipient: detectRecipient(cleanTitle),
      isFunny: detectHumor(cleanTitle)
    };

    const tags = generateProductIsolatedTags(signals);

    res.status(200).json({
      success: true,
      tags,
      product_locked: signals.product,
      status: 'search-optimized'
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

/* ── SIGNAL DETECTION ───────────────────────────────────── */

function detectOccasion(t) {
  const s = t.toLowerCase();
  if (s.includes('christmas') || s.includes('xmas') || s.includes('holiday')) return 'christmas';
  if (s.includes('birthday') || s.includes('bday')) return 'birthday';
  if (s.includes('wedding') || s.includes('bride') || s.includes('groom')) return 'wedding';
  if (s.includes('baby') || s.includes('shower') || s.includes('newborn')) return 'baby shower';
  if (s.includes('valentine') || s.includes('valentines')) return 'valentine';
  if (s.includes('thanksgiving')) return 'thanksgiving';
  if (s.includes('easter')) return 'easter';
  if (s.includes('halloween')) return 'halloween';
  if (s.includes('mothers') || s.includes('mothers day')) return 'mothers day';
  if (s.includes('fathers') || s.includes('fathers day')) return 'fathers day';
  if (s.includes('graduation') || s.includes('grad')) return 'graduation';
  return 'gift';
}

function detectRecipient(t) {
  const s = t.toLowerCase();
  if (s.includes('mom') || s.includes('mother') || s.includes('mum')) return 'mom';
  if (s.includes('dad') || s.includes('father')) return 'dad';
  if (s.includes('grandma') || s.includes('grandmother')) return 'grandma';
  if (s.includes('grandpa') || s.includes('grandfather')) return 'grandpa';
  if (s.includes('teacher')) return 'teacher';
  if (s.includes('friend')) return 'friend';
  if (s.includes('sister')) return 'sister';
  if (s.includes('brother')) return 'brother';
  if (s.includes('wife')) return 'wife';
  if (s.includes('husband')) return 'husband';
  if (s.includes('couple')) return 'couple';
  if (s.includes('family')) return 'family';
  return 'family';
}

function detectHumor(t) {
  return /\bfunny\b|\bhumor\b|\bjoke\b|\bmeme\b|\bsarcastic\b|\bpun\b|\bdad joke\b/.test(t.toLowerCase());
}

/* ── PRODUCT-ISOLATED SEARCH SIMULATOR ─────────────────── */

function generateProductIsolatedTags(signals) {
  const { product, occasion, recipient, isFunny } = signals;
  const tags = new Set();

  const add = (tag) => {
    if (!tag) return;
    const clean = tag.toLowerCase().trim().replace(/\s+/g, ' ');
    const words = clean.split(' ').filter(Boolean);
    
    // ENFORCE 2-5 WORDS
    if (words.length < 2 || words.length > 5) return;
    
    // BLOCK MARKETING SPAM
    const BANNED = [
      'personalized', 'personalised', 'customized',
      'design', 'designs', 'designer',
      'gift idea', 'gift ideas',
      'creative', 'creativity',
      'artwork', 'art', 'artistic',
      'aesthetic', 'aesthetics',
      'modern', 'contemporary',
      'elegant', 'stylish', 'trendy',
      'handmade', 'handcrafted',
      'unique', 'special',
      'perfect', 'best',
      'themed', 'theme',
      'style', 'styling',
      'hand drawn', 'digital',
      'vintage', 'retro', 'classic',
      'minimalist', 'simple',
      'colorful', 'color palette',
      'pattern', 'print'
    ];
    
    if (BANNED.some(b => clean.includes(b))) return;
    
    // MUST CONTAIN PRODUCT
    if (!clean.includes(product)) return;
    
    tags.add(clean);
  };

  // CORE SEARCH PATTERNS (PRODUCT-LOCKED)
  add(`${occasion} ${product} for ${recipient}`);
  add(`${occasion} ${product}`);
  add(`${product} for ${recipient}`);
  add(`${occasion} ${product} gift`);
  add(`${product} gift for ${recipient}`);
  add(`${occasion} ${product} for family`);
  add(`${product} for family`);
  
  // RECIPIENT VARIANTS
  if (recipient !== 'mom') add(`${occasion} ${product} for mom`);
  if (recipient !== 'dad') add(`${occasion} ${product} for dad`);
  if (recipient !== 'teacher') add(`${occasion} ${product} for teacher`);
  
  // OCCASION VARIANTS
  if (occasion !== 'christmas') add(`christmas ${product} for ${recipient}`);
  if (occasion !== 'birthday') add(`birthday ${product} for ${recipient}`);
  
  // HUMOR (ONLY IF DETECTED)
  if (isFunny) {
    add(`funny ${product} for ${recipient}`);
    add(`funny ${occasion} ${product}`);
  }

  // PRODUCT-SPECIFIC PATTERNS
  switch(product) {
    case 'shirt':
    case 't-shirt':
    case 'tee':
      add(`${occasion} graphic tee`);
      add(`${product} for ${recipient}`);
      break;
    case 'mug':
      add(`${occasion} coffee mug`);
      add(`coffee mug for ${recipient}`);
      break;
    case 'card':
    case 'greeting card':
    case 'invitation':
      add(`${occasion} greeting card`);
      add(`${occasion} thank you card`);
      add(`thank you card for ${recipient}`);
      break;
    case 'ornament':
      add(`${occasion} ornament`);
      add(`christmas tree ornament`);
      break;
    case 'pillow':
      add(`${occasion} throw pillow`);
      add(`decorative pillow for ${recipient}`);
      break;
    case 'poster':
    case 'print':
      add(`${occasion} wall art`);
      add(`${occasion} art print`);
      break;
    case 'sticker':
      add(`${occasion} vinyl sticker`);
      add(`${product} for ${recipient}`);
      break;
    case 'tote':
    case 'tote bag':
      add(`${occasion} tote bag`);
      add(`canvas tote for ${recipient}`);
      break;
    case 'phone case':
    case 'phonecase':
      add(`${occasion} phone case`);
      add(`iphone case for ${recipient}`);
      break;
    case 'blanket':
      add(`${occasion} throw blanket`);
      add(`cozy blanket for ${recipient}`);
      break;
    case 'hoodie':
      add(`${occasion} hoodie`);
      add(`${product} for ${recipient}`);
      break;
  }

  // CONVERT TO ARRAY AND LIMIT TO 10
  const result = Array.from(tags).slice(0, 10);

  // EMERGENCY FILL (IF LESS THAN 10)
  while (result.length < 10) {
    const fallbacks = [
      `${occasion} ${product}`,
      `${product} for ${recipient}`,
      `${occasion} ${product} gift`,
      `${product} ${occasion}`,
      `best ${product} for ${occasion}`
    ];
    const next = fallbacks[result.length % fallbacks.length];
    if (!result.includes(next) && next.split(' ').length >= 2) {
      result.push(next);
    } else {
      break;
    }
  }

  return result.slice(0, 10);
}
