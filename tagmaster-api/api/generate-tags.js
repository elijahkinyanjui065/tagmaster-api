/* api/generate-tags.js — Universal SEO Engine */

// 1. THE SAFETY VAULT (Trademarks/Banned Words)
const TRADEMARKS = [
  'disney', 'marvel', 'nike', 'adidas', 'star wars', 'pokemon', 'barbie',
  'customized', 'personalized', 'cheap', 'best' // Zazzle-prohibited or low-value
];

// 2. THE UNIVERSAL FORMULA ENGINE (Server-Side)
function buildUniversalTags(input = '') {
  const raw = input.toLowerCase().trim();
  const out = [];

  // Helper: Validates tag against universal 2-3 word rule
  function add(tag) {
    const s = tag?.toLowerCase().trim().replace(/\s+/g, ' ');
    const words = s ? s.split(' ').length : 0;
    if (s && words >= 2 && words <= 3 && s.length <= 24 && !out.includes(s)) {
      out.push(s);
    }
  }

  // Extract Core Pillars
  const productMatch = raw.match(/(shirt|mug|poster|card|sticker|tote|pillow|invitation|label|tag)/i);
  const product = productMatch ? productMatch[0] : 'gift';
  
  const tokens = raw.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !['the','and','for','with'].includes(w));
  const primary = tokens[0] || 'design';

  // Apply Formula
  add(`${primary} ${product}`); // Anchor
  
  // Logic-based variations
  if (raw.includes('wedding')) {
    add('wedding invitation');
    add('modern wedding');
    add('elegant invite');
  } else if (raw.includes('birthday')) {
    add('birthday gift');
    add('happy birthday');
    add(`birthday ${product}`);
  } else {
    add(`${primary} gift`);
    add('gift for him');
    add('gift for her');
  }

  // Style/Context Layer
  const styles = ['watercolor', 'vintage', 'minimalist', 'floral', 'retro', 'modern'];
  const foundStyle = styles.find(s => raw.includes(s));
  if (foundStyle) {
    add(`${foundStyle} ${product}`);
    add(`${primary} ${foundStyle}`);
  }

  // Search-Pattern Layer
  add(`unique ${product}`);
  add(`${primary} art`);
  add(`${primary} design`);

  // Finalization: Return unique array
  return out;
}

// 3. THE IP FILTER
function ipFilter(tags = []) {
  return tags.filter(tag => {
    const t = tag.toLowerCase();
    return !TRADEMARKS.some(tm => t.includes(tm));
  });
}

// 4. EXPORTED HANDLER
export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { title, spyUrl } = req.body;
    const input = title || spyUrl || '';

    if (!input) return res.status(200).json({ success: false, tags: [] });

    // Generate using Universal Formula
    let tags = buildUniversalTags(input);

    // Filter and Sanitize
    tags = ipFilter(tags)
      .map(t => t.replace(/[&#]/g, ''))
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .slice(0, 10);

    // Deterministic Backfill (Safety check for exactly 10)
    const primaryWord = input.split(/\s+/)[0] || 'design';
    const filler = `${primaryWord} gift`.toLowerCase();
    
    let attempts = 0;
    while (tags.length < 10 && attempts < 10) {
      const extra = [`unique gift`, `${primaryWord} art`, `cool ${primaryWord}`][attempts % 3];
      if (!tags.includes(extra)) tags.push(extra);
      attempts++;
    }
    
    // Final hard-fill if needed
    while (tags.length < 10) tags.push(filler);

    return res.status(200).json({
      success: true,
      tags: tags.slice(0, 10),
      count: 10,
      engine: "Universal_v2"
    });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(200).json({ success: false, tags: [], error: 'internal_error' });
  }
}
