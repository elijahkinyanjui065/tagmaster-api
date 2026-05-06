/* TAGMASTER V6.1 — DETERMINISTIC + NULL-SAFE */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { title, product } = req.body;
    if (!title || !product) return res.status(400).json({ error: 'Title + product required' });

    const t = title.toLowerCase();

    const signals = {
      product: product.toLowerCase(),
      occasion: detectOccasion(t),      // null if not found
      recipient: detectRecipient(t),    // null if not found
      isFunny: detectHumor(t)
    };

    const tags = generateStructuredTags(signals);
    return res.status(200).json({ success: true, tags });

  } catch (e) {
    return res.status(500).json({ error: 'Engine failure' });
  }
}

function detectOccasion(t) {
  if (/christmas|xmas|holiday|santa/.test(t)) return 'christmas';
  if (/birthday|bday/.test(t)) return 'birthday';
  if (/wedding|bride|groom/.test(t)) return 'wedding';
  if (/baby|shower|newborn/.test(t)) return 'baby';
  if (/valentine|valentines/.test(t)) return 'valentine';
  return null;
}

function detectRecipient(t) {
  if (/\bmom\b|\bmother\b/.test(t)) return 'mom';
  if (/\bdad\b|\bfather\b/.test(t)) return 'dad';
  if (/\bfamily\b/.test(t)) return 'family';
  if (/\bfriend\b/.test(t)) return 'friend';
  if (/\bteacher\b/.test(t)) return 'teacher';
  if (/\bcoworker\b|\bboss\b/.test(t)) return 'coworker';
  return null;
}

function detectHumor(t) {
  return /funny|joke|meme|humor|pun/.test(t);
}

function generateStructuredTags({ product, occasion, recipient, isFunny }) {
  if (!product) return [];

  const o = occasion;
  const r = recipient;
  const p = product;
  const used = new Set();
  const out = [];

  const add = (tag) => {
    if (!tag || tag.includes('null')) return;
    const clean = tag.toLowerCase().trim().replace(/\s+/g, ' ');
    const wc = clean.split(' ').length;
    if (wc < 3 || wc > 5) return;
    if (used.has(clean)) return;
    // block marketing generics
    if (/graphic tee|greeting card|thank you card|idea piece|artwork/.test(clean)) return;
    used.add(clean);
    out.push(clean);
  };

  // 10-slot structure, null-safe
  add(o && r ? `${o} ${p} for ${r}` : o ? `${o} ${p} gift idea` : null);
  add(r && o ? `${r} ${o} ${p}` : o ? `${o} ${p} for family` : null);
  add(o ? `${o} ${p} gift` : `${p} holiday gift`);
  add(o && r ? `${o} gift for ${r}` : o ? `${o} gift idea` : null);
  add(r ? `${p} gift for ${r}` : `${p} ${o || 'holiday'} gift`);
  add(o ? `${o} ${p} for adults` : `${p} festive gift idea`);
  add(r ? `${p} for ${r} gift` : `${p} holiday present`);
  add(isFunny && o ? `funny ${o} ${p}` : o ? `${o} ${p} idea` : `funny ${p} gift`);
  add(o ? `${o} ${p} design` : `${p} winter design`);
  add(o ? `${o} ${p} theme` : `${p} holiday theme`);

  // final product lock
  return out.filter(t => t.includes(p)).slice(0, 10);
}
