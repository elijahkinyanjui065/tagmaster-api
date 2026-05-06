/* TAGMASTER V6 — DETERMINISTIC + RANKED ENGINE */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, product } = req.body;

    if (!title || !product) {
      return res.status(400).json({ error: 'Title + product required' });
    }

    const cleanTitle = title.toLowerCase();

    const signals = {
      product: product.toLowerCase(),
      occasion: detectOccasion(cleanTitle),
      recipient: detectRecipient(cleanTitle),
      isFunny: detectHumor(cleanTitle)
    };

    const rawTags = generateBaseTags(signals);
    const finalTags = refineAndRankTags(rawTags, signals);

    return res.status(200).json({
      success: true,
      tags: finalTags
    });

  } catch (e) {
    return res.status(500).json({ error: 'Engine failure' });
  }
}

/* ─────────────────────────────
   SIGNAL DETECTION
───────────────────────────── */

function detectOccasion(t) {
  if (t.includes('christmas') || t.includes('xmas') || t.includes('holiday')) return 'christmas';
  if (t.includes('birthday')) return 'birthday';
  if (t.includes('wedding')) return 'wedding';
  return 'gift';
}

function detectRecipient(t) {
  if (t.includes('mom')) return 'mom';
  if (t.includes('dad')) return 'dad';
  if (t.includes('family')) return 'family';
  return 'family';
}

function detectHumor(t) {
  return /funny|joke|meme/.test(t);
}

/* ─────────────────────────────
   STAGE 1: GENERATION (WIDE POOL)
───────────────────────────── */

function generateBaseTags({ product, occasion, recipient, isFunny }) {
  const pool = new Set();

  const add = (tag) => {
    if (!tag) return;
    const clean = tag.toLowerCase().trim();
    if (clean.split(' ').length < 2 || clean.split(' ').length > 5) return;
    pool.add(clean);
  };

  // CORE
  add(`${occasion} ${product}`);
  add(`${product} for ${recipient}`);
  add(`${occasion} ${product} for ${recipient}`);

  // BUYER INTENT
  add(`${product} gift for ${recipient}`);
  add(`${occasion} ${product} gift`);

  // USE CASE
  add(`family ${occasion} ${product}`);
  add(`holiday ${product} for ${recipient}`);

  // FUNCTIONAL (PRODUCT LOCKED)
  if (product === 'card') {
    add(`christmas greeting card`);
    add(`holiday thank you card`);
  }

  if (product === 'shirt') {
    add(`christmas graphic tee`);
    add(`holiday shirt outfit`);
  }

  // HUMOR
  if (isFunny) {
    add(`funny ${product} for ${recipient}`);
  }

  // LONG TAIL
  add(`${recipient} holiday ${product}`);
  add(`matching family ${product}`);

  return Array.from(pool);
}

/* ─────────────────────────────
   STAGE 2: REFINEMENT + RANKING
───────────────────────────── */

function refineAndRankTags(tags, signals) {
  const { product, occasion, recipient } = signals;

  const banned = new Set([
    `${occasion} ${product}`,
    `${product}`,
    `graphic tee`,
    `greeting card`,
    `thank you card`
  ]);

  const score = (tag) => {
    let s = 0;

    if (tag.includes(product)) s += 5;
    if (tag.includes(occasion)) s += 4;
    if (recipient && tag.includes(recipient)) s += 4;

    if (tag.split(' ').length <= 2) s -= 3;

    return s;
  };

  const cleaned = tags
    // HARD PRODUCT LOCK
    .filter(tag => tag.includes(product))

    // REMOVE GENERIC
    .filter(tag => !banned.has(tag))

    // REMOVE SEMANTIC DUPES
    .filter((tag, i, arr) =>
      arr.findIndex(t =>
        t.replace(product, '') === tag.replace(product, '')
      ) === i
    );

  return cleaned
    .map(tag => ({ tag, score: score(tag) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.tag)
    .slice(0, 10);
}
