/* api/generate-tags.js — Universal SEO Engine v3 - No Robots */
Give
// 1. THE SAFETY VAULT
const TRADEMARKS = [
  'disney', 'marvel', 'nike', 'adidas', 'star wars', 'pokemon', 'barbie',
  'customized', 'personalized', 'cheap', 'best'
];

// 2. THE UNIVERSAL FORMULA ENGINE - NO ROBOTS
function buildUniversalTags(input = '') {
  const raw = input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();

  // Stop words + generic adjectives to nuke
  const STOP = new Set(['the','and','for','with','from','your','this','that','a','an']);
  const BANNED = new Set(['best','good','new','sale','top','nice','buy','item','unique','cool','modern','idea','style','art','gift','design','cheap','customized','personalized']);

  const tokens = raw.split(/\s+/).filter(w => w.length > 2 &&!STOP.has(w));
  if (tokens.length === 0) return ['custom design', 'party supplies'];

  const out = new Set();
  const add = (tag) => {
    const words = tag.split(' ');
    const clean = tag.toLowerCase().trim();
    const wordCount = words.length;
    const hasBanned = words.some(w => BANNED.has(w));
    if (wordCount >= 2 && wordCount <= 3 && clean.length <= 24 &&!hasBanned) {
      out.add(clean);
    }
  };

  // Rule 1: 2-word adjacent combos from title
  for (let i = 0; i < tokens.length - 1; i++) {
    add(${tokens[i]} ${tokens[i+1]});
  }

  // Rule 2: 3-word adjacent combos from title
  for (let i = 0; i < tokens.length - 2; i++) {
    add(${tokens[i]} ${tokens[i+1]} ${tokens[i+2]});
  }

  // Rule 3: Zazzle intent detection
  const joined = tokens.join(' ');
  if (joined.includes('birthday')) {
    add('first birthday invite');
    add('birthday party invite');
    add('kids birthday');
  }
  if (joined.includes('wedding')) {
    add('bridal shower invite');
    add('wedding invitation');
    add('engagement party');
  }
  if (joined.includes('baby') && joined.includes('shower')) add('baby shower invite');
  if (joined.includes('unicorn')) add('magical unicorn party');
  if (joined.includes('invitation') || joined.includes('invite')) add('party invitation');

  // Rule 4: Style + Noun if style exists
  const STYLES = ['watercolor','vintage','minimalist','floral','retro','boho','rustic'];
  const foundStyle = STYLES.find(s => tokens.includes(s));
  const product = tokens.find(w => /(shirt|mug|poster|card|sticker|tote|pillow|invitation|label)/.test(w));
  if (foundStyle && product) add(${foundStyle} ${product});
  if (foundStyle && tokens[0]!== foundStyle) add(${foundStyle} ${tokens[0]});

  return [...out];
}

// 3. THE IP FILTER
function ipFilter(tags = []) {
  return tags.filter(tag => {
    const t = tag.toLowerCase();
    return!TRADEMARKS.some(tm => t.includes(tm));
  });
}

// 4. EXPORTED HANDLER
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method!== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { title } = req.body;
    const input = title || '';

    if (!input) return res.status(200).json({ success: true, tags: [] });

    let tags = buildUniversalTags(input);

    tags = ipFilter(tags)
     .map(t => t.replace(/[&#]/g, ''))
     .filter((t, i, arr) => arr.indexOf(t) === i);

    // Smart backfill: NO GENERICS. Use title words only.
    const tokens = input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const BANNED = new Set(['best','good','new','sale','top','nice','buy','item','unique','cool','modern','idea','style','art','gift','design','cheap','customized','personalized']);
    let i = 0;
    while (tags.length < 10 && tokens.length >= 2) {
      const fallback = ${tokens[i % tokens.length]} ${tokens[(i + 1) % tokens.length]};
      const words = fallback.split(' ');
      if (!tags.includes(fallback) && words[0]!== words[1] &&!words.some(w => BANNED.has(w))) {
        tags.push(fallback);
      }
      i++;
      if (i > 30) break;
    }

    return res.status(200).json({
      success: true,
      tags: tags.slice(0, 10),
      count: tags.length,
      engine: "Universal_v3_NoRobots"
    });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(200).json({ success: false, tags: [], error:/* api/generate-tags.js — Universal SEO Engine v3 - No Robots */

// 1. THE SAFETY VAULT
const TRADEMARKS = [
  'disney', 'marvel', 'nike', 'adidas', 'star wars', 'pokemon', 'barbie',
  'customized', 'personalized', 'cheap', 'best'
];

// 2. THE UNIVERSAL FORMULA ENGINE - NO ROBOTS
function buildUniversalTags(input = '') {
  const raw = input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();

  // Stop words + generic adjectives to nuke
  const STOP = new Set(['the','and','for','with','from','your','this','that','a','an']);
  const BANNED = new Set(['best','good','new','sale','top','nice','buy','item','unique','cool','modern','idea','style','art','gift','design','cheap','customized','personalized']);

  const tokens = raw.split(/\s+/).filter(w => w.length > 2 &&!STOP.has(w));
  if (tokens.length === 0) return ['custom design', 'party supplies'];

  const out = new Set();
  const add = (tag) => {
    const words = tag.split(' ');
    const clean = tag.toLowerCase().trim();
    const wordCount = words.length;
    const hasBanned = words.some(w => BANNED.has(w));
    if (wordCount >= 2 && wordCount <= 3 && clean.length <= 24 &&!hasBanned) {
      out.add(clean);
    }
  };

  // Rule 1: 2-word adjacent combos from title
  for (let i = 0; i < tokens.length - 1; i++) {
    add(${tokens[i]} ${tokens[i+1]});
  }

  // Rule 2: 3-word adjacent combos from title
  for (let i = 0; i < tokens.length - 2; i++) {
    add(${tokens[i]} ${tokens[i+1]} ${tokens[i+2]});
  }

  // Rule 3: Zazzle intent detection
  const joined = tokens.join(' ');
  if (joined.includes('birthday')) {
    add('first birthday invite');
    add('birthday party invite');
    add('kids birthday');
  }
  if (joined.includes('wedding')) {
    add('bridal shower invite');
    add('wedding invitation');
    add('engagement party');
  }
  if (joined.includes('baby') && joined.includes('shower')) add('baby shower invite');
  if (joined.includes('unicorn')) add('magical unicorn party');
  if (joined.includes('invitation') || joined.includes('invite')) add('party invitation');

  // Rule 4: Style + Noun if style exists
  const STYLES = ['watercolor','vintage','minimalist','floral','retro','boho','rustic'];
  const foundStyle = STYLES.find(s => tokens.includes(s));
  const product = tokens.find(w => /(shirt|mug|poster|card|sticker|tote|pillow|invitation|label)/.test(w));
  if (foundStyle && product) add(${foundStyle} ${product});
  if (foundStyle && tokens[0]!== foundStyle) add(${foundStyle} ${tokens[0]});

  return [...out];
}

// 3. THE IP FILTER
function ipFilter(tags = []) {
  return tags.filter(tag => {
    const t = tag.toLowerCase();
    return!TRADEMARKS.some(tm => t.includes(tm));
  });
}

// 4. EXPORTED HANDLER
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method!== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { title } = req.body;
    const input = title || '';

    if (!input) return res.status(200).json({ success: true, tags: [] });

    let tags = buildUniversalTags(input);

    tags = ipFilter(tags)
     .map(t => t.replace(/[&#]/g, ''))
     .filter((t, i, arr) => arr.indexOf(t) === i);

    // Smart backfill: NO GENERICS. Use title words only.
    const tokens = input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const BANNED = new Set(['best','good','new','sale','top','nice','buy','item','unique','cool','modern','idea','style','art','gift','design','cheap','customized','personalized']);
    let i = 0;
    while (tags.length < 10 && tokens.length >= 2) {
      const fallback = ${tokens[i % tokens.length]} ${tokens[(i + 1) % tokens.length]};
      const words = fallback.split(' ');
      if (!tags.includes(fallback) && words[0]!== words[1] &&!words.some(w => BANNED.has(w))) {
        tags.push(fallback);
      }
      i++;
      if (i > 30) break;
    }

    return res.status(200).json({
      success: true,
      tags: tags.slice(0, 10),
      count: tags.length,
      engine: "Universal_v3_NoRobots"
    });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(200).json({ success: false, tags: [], error: 'internal_error' });
  }
} 'internal_error' });
  }
}
