/* TagMaster Pro — content.js v3.0 Engine */

const API = 'https://tagmaster-api.vercel.app/api/generate-tags';

console.log('[TagMaster] Loaded:', window.location.href);

// ── MESSAGE LISTENER ─────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'generate') {
    generateAndApply()
    .then(() => sendResponse({ ok: true }))
    .catch(e => sendResponse({ error: e.message }));
    return true;
  }
  if (msg.action === 'spy') {
    spyAndApply(msg.url)
    .then(() => sendResponse({ ok: true }))
    .catch(e => sendResponse({ error: e.message }));
    return true;
  }
});

// ── GET TITLE ────────────────────────────────────────────────
function getTitle() {
  const candidates = [
    document.querySelector('input[placeholder*="Title" i]'),
    document.querySelector('input[placeholder*="Product Name" i]'),
    document.querySelector('input[name="name"]'),
    document.querySelector('input[name="title"]'),
    document.querySelector('input[name="product_title"]'),
    document.querySelector('[data-testid="product-title"]'),
    document.querySelector('[data-testid="product-title-input"]'),
   ...[...document.querySelectorAll('input[type="text"]')]
    .filter(i => i.offsetWidth > 200 && i.offsetParent!== null),
  ];

  for (const el of candidates) {
    if (!el) continue;
    const val = (el.value || el.innerText || '').trim();
    if (val.length >= 3 &&!/^(zazzle|create|product|untitled|new product|product title)$/i.test(val)) {
      console.log('[TagMaster] Title found:', val);
      return val;
    }
  }
  console.warn('[TagMaster] Title not found — tried all selectors');
  return '';
}

// ── FIND TAG INPUT ───────────────────────────────────────────
function findTagInput() {
  return (
    document.querySelector('.TagInputList-input input') ||
    document.querySelector('.TagInputList input') ||
    document.querySelector('[class*="TagInputList"] input') ||
    document.querySelector('input[placeholder*="tag" i]')
  );
}
function findTagContainer() {
  return (
    document.querySelector('.TagInputList-inputRow') ||
    document.querySelector('.TagInputList') ||
    document.querySelector('[class*="TagInputList"]')
  );
}

// ── V3.0 DETECTORS ───────────────────────────────────────────
const BLACKLIST = ['custom', 'personalized', 'customizable', 'gift idea', 'sale', 'cheap', 'best'];
const PRODUCT_TYPES = ['mug', 'shirt', 'tee', 'card', 'sticker', 'poster', 'pillow', 'tote', 'bag', 'ornament', 'print'];
const ALCOHOL_TRIGGERS = ['beer stein', 'shot glass', 'wine label', 'flask', 'barware', 'coaster', 'beer', 'wine', 'alcohol', 'whiskey'];

function cleanText(str) {
  if (!str) return '';
  let s = str.toLowerCase().trim();
  BLACKLIST.forEach(b => s = s.replace(new RegExp(`\\b${b}\\b`, 'gi'), ''));
  return s.replace(/\s+/g, ' ').trim();
}

function detectOccasion(t){
  if(/\b(easter|bunny|spring)\b/i.test(t)) return 'Easter';
  if(/\b(birthday|bday)\b/i.test(t)) return 'Birthday';
  if(/\b(christmas|xmas|holiday)\b/i.test(t)) return 'Christmas';
  if(/\b(wedding|bride|groom|engagement)\b/i.test(t)) return 'Wedding';
  if(/\b(halloween|spooky|pumpkin)\b/i.test(t)) return 'Halloween';
  if(/\b(baby|shower|newborn)\b/i.test(t)) return 'Baby Shower';
  if(/\b(graduation|grad)\b/i.test(t)) return 'Graduation';
  if(/\b(mothers day|mom)\b/i.test(t)) return 'Mothers Day';
  if(/\b(fathers day|dad)\b/i.test(t)) return 'Fathers Day';
  return null;
}

function detectStyle(t){
  if(/\b(floral|flower|botanical|bloom|rose|peony)\b/i.test(t)) return 'Floral';
  if(/\b(cute|kawaii|adorable)\b/i.test(t)) return 'Cute';
  if(/\b(vintage|retro|antique|classic)\b/i.test(t)) return 'Vintage';
  if(/\b(colorful|rainbow|bright|vibrant)\b/i.test(t)) return 'Colorful';
  if(/\b(modern|minimalist|sleek|contemporary)\b/i.test(t)) return 'Modern';
  if(/\b(boho|bohemian)\b/i.test(t)) return 'Boho';
  if(/\b(funny|humor|humorous|witty|sarcastic)\b/i.test(t)) return 'Funny';
  if(/\b(watercolor|painted|artistic)\b/i.test(t)) return 'Watercolor';
  return 'Unique';
}

function detectProductType(t){
  if(/\b(shirt|tee|tshirt|apparel)\b/i.test(t)) return 'tshirt';
  if(/\b(mug|cup)\b/i.test(t)) return 'mug';
  if(/\b(poster|print|wall art)\b/i.test(t)) return 'poster';
  if(/\b(card|invitation|stationery)\b/i.test(t)) return 'card';
  if(/\b(pillow|throw|cushion)\b/i.test(t)) return 'pillow';
  if(/\b(tote|bag)\b/i.test(t)) return 'tote';
  if(/\b(sticker|decal)\b/i.test(t)) return 'sticker';
  if(/\b(beer stein|shot glass|flask|wine)\b/i.test(t)) return 'barware';
  return 'design';
}

function detectAudience(t){
  if(/\b(kid|child|baby|toddler|bunny)\b/i.test(t)) return 'Kids';
  if(/\b(women|woman|girl|her|mom|wife|bride|sister)\b/i.test(t)) return 'Women';
  if(/\b(men|man|boy|him|dad|husband|groom|brother)\b/i.test(t)) return 'Men';
  if(/\b(nurse|teacher|doctor|chef)\b/i.test(t)) return t.match(/\b(nurse|teacher|doctor|chef)\b/i)[0];
  return null;
}

function detectCategory(productType){
  if(['card', 'stationery', 'invitation'].includes(productType)) return 'Stationery/Cards';
  if(['tshirt', 'apparel'].includes(productType)) return 'Apparel/Shirts';
  if(['pillow', 'poster', 'print'].includes(productType)) return 'Home Decor';
  return 'Everything Else';
}

function getSynonym(word, index = 0) {
  const synMap = {
    'vintage': ['retro', 'classic', 'antique'],
    'floral': ['botanical', 'flower', 'bloom'],
    'funny': ['humorous', 'witty', 'comical'],
    'modern': ['contemporary', 'sleek', 'minimalist'],
    'cute': ['adorable', 'kawaii', 'charming'],
    'colorful': ['vibrant', 'rainbow', 'bright'],
    'design': ['artwork', 'graphic', 'pattern'],
    'watercolor': ['painted', 'artistic', 'aesthetic']
  };
  const base = word.toLowerCase();
  return synMap[base]?.[index] || word;
}

// ── V3.0 TAG BUILDER - 10 TAG SEQUENCE ───────────────────────
function buildTags(title) {
  const raw = title || '';
  const rawLower = raw.toLowerCase();

  // Extract components
  const primary = cleanText(raw.split(/\s+/).slice(0,3).join(' ')) || 'Art Design'; // First 3 words as primary
  const style = detectStyle(rawLower);
  const occasion = detectOccasion(rawLower);
  const audience = detectAudience(rawLower);
  const productType = detectProductType(rawLower);
  const category = detectCategory(productType);
  const isAlcohol = ALCOHOL_TRIGGERS.some(t => rawLower.includes(t));

  // Helper: cap at 5 words, scrub product types
  const formatTag = (str) => {
    let s = cleanText(str);
    PRODUCT_TYPES.forEach(p => s = s.replace(new RegExp(`\\b${p}\\b`, 'gi'), ''));
    return s.split(' ').filter(w => w).slice(0, 5).join(' ');
  };

  // Kids Safety Lock
  const sanitizeKids = (tag) => {
    if (!isAlcohol) return tag;
    if (/\b(kids|children|toddler|baby|kindergarten|school)\b/i.test(tag)) {
      return `${style} Design`;
    }
    return tag;
  };

  let tags = [];

  // PHASE 1: SEO Foundation - Tags 1-3
  tags[0] = formatTag(`${primary} ${style}`); // Tag 1
  tags[1] = formatTag(`${primary} ${getSynonym(style, 0)}`); // Tag 2 - synonym
  tags[2] = formatTag(`${getSynonym(primary.split(' ')[0], 0)} ${style} Design`); // Tag 3 - synonym primary

  // PHASE 2: Intent & Persona - Tags 4-5 with Weighting
  // Tag 4: Gift Intent - prioritize Occasion for Stationery
  if (category === 'Stationery/Cards' && occasion) {
    tags[3] = formatTag(`${occasion} Gift`);
  } else if (audience && ['Mom','Dad','Sister','Brother'].includes(audience)) {
    tags[3] = formatTag(`${audience} Gift`);
  } else if (occasion) {
    tags[3] = formatTag(`${occasion} Present`);
  } else {
    tags[3] = formatTag(`${style} Gift`);
  }

  // Tag 5: Audience - prioritize for Apparel, apply Safety Lock
  let tag5 = '';
  if (category === 'Apparel/Shirts' && audience) {
    tag5 = `Gift for ${audience}`;
  } else if (audience) {
    tag5 = `Gift for ${audience}`;
  } else {
    tag5 = `${style} Design`;
  }
  tags[4] = formatTag(sanitizeKids(tag5));

  // PHASE 3: Long-Tail - Tags 6-7
  const vibe = style === 'Funny'? 'Sarcastic' : 'Elegant';
  tags[5] = formatTag(`${primary} ${style} ${vibe} Design`);
  tags[6] = formatTag(`${style} ${vibe} ${audience || 'Art'} Gift`);

  // PHASE 4: Dynamic Mix - Tags 8-10 Category-Specific
  const catMap = {
    'Stationery/Cards': [
      `${style} ${occasion || 'Celebration'}`,
      `${occasion || 'Special'} Stationery`,
      `${primary.split(' ')[0]} Card`
    ],
    'Apparel/Shirts': [
      `${audience || style} ${primary.split(' ')[0]}`,
      `${style} Apparel`,
      `Sarcastic ${primary.split(' ')[0]} Tee`
    ],
    'Home Decor': [
      `${style} ${primary.split(' ')[0]}`,
      `${primary.split(' ')[0]} Decor`,
      `${style} Home Gift`
    ],
    'Everything Else': [
      `${style} ${primary.split(' ')[0]}`,
      `${primary.split(' ')[0]} ${style}`,
      `${occasion || 'Special'} Gift`
    ]
  };

  const dynamic = catMap[category];
  tags[7] = formatTag(dynamic[0]);
  tags[8] = formatTag(dynamic[1]);
  tags[9] = formatTag(dynamic[2]);

  // GUARDRAILS: Ensure Tag 1!= Tag 2
  if (tags[0] === tags[1]) {
    tags[1] = formatTag(`${primary} ${getSynonym(style, 1)} Art`);
  }

  // Final pass: Safety Lock, unique, exactly 10
  tags = tags.map(sanitizeKids).filter(t => t && t.length >= 2);
  tags = [...new Set(tags)]; // Dedupe

  while (tags.length < 10) {
    tags.push(formatTag(`${style} ${primary.split(' ')[0]} Artwork`));
  }

  return tags.slice(0, 10);
}

// ── SANITIZE FOR ZAZZLE ──────────────────────────────────────
function sanitizeForZazzle(tags) {
  return tags
  .map(t => t.toLowerCase().trim().replace(/[&#]/g, ''))
  .filter(t => t.length >= 2 && t.length <= 20)
  .filter((t, i, arr) => arr.indexOf(t) === i)
  .slice(0, 10);
}

// ── CALL API ─────────────────────────────────────────────────
async function callAPI(body) {
  console.log('[TagMaster] Calling API with:', body);
  let res;
  try {
    res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_) {
    throw new Error('Cannot reach server. Check internet connection.');
  }
  const data = await res.json();
  console.log('[TagMaster] API response:', data);
  if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
  return data;
}

// ── GENERATE AND APPLY ───────────────────────────────────────
async function generateAndApply() {
  const title = getTitle();
  if (!title) throw new Error('Title not found.');

  let data;
  try {
    data = await callAPI({ title });
  } catch {
    data = { tags: buildTags(title) };
  }

  let tags = data.tags || [];
  if (!tags.length) tags = buildTags(title);

  tags = sanitizeForZazzle(tags);

  const filled = await fillTags(tags);
  if (!filled) {
    await navigator.clipboard.writeText(tags.join(', ')).catch(() => {});
    throw new Error('Tag field not found — tags copied to clipboard.');
  }
}

// ── FILL TAGS INTO ZAZZLE ────────────────────────────────────
async function fillTags(tags) {
  const input = findTagInput();
  const container = findTagContainer();
  if (!input ||!container) return false;

  // Clear existing tags first
  const existing = container.querySelectorAll('.TagInputList-tag');
  existing.forEach(t => t.querySelector('[class*="remove"]')?.click());

  for (const tag of tags) {
    input.value = tag;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await new Promise(r => setTimeout(r, 100)); // Zazzle needs delay
  }
  return true;
}

// ── SPY AND APPLY ────────────────────────────────────────────
async function spyAndApply(url) {
  const data = await callAPI({ spyUrl: url });
  let tags = data.spyTags || [];
  if (!tags.length) throw new Error('No tags found on that page.');
  tags = sanitizeForZazzle(tags);
  const filled = await fillTags(tags);
  if (!filled) {
    await navigator.clipboard.writeText(tags.join(', ')).catch(() => {});
    throw new Error('Tag field not found — tags copied to clipboard.');
  }
}

// ── PANEL + INIT ─────────────────────────────────
function createPanel(container) {
  if (document.getElementById('tm-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'tm-panel';
  panel.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;background:#fff;padding:10px;border:2px solid #333;border-radius:8px;';
  panel.innerHTML = `
    <button id="tm-gen-btn">Generate Tags v3</button>
    <input id="tm-spy-input" placeholder="Competitor Zazzle URL" style="display:block;margin:5px 0;">
    <button id="tm-spy-btn">Spy Tags</button>
    <div id="tm-status" style="font-size:11px;margin-top:5px;"></div>
  `;
  document.body.appendChild(panel);

  const genBtn=document.getElementById('tm-gen-btn');
  const spyBtn=document.getElementById('tm-spy-btn');
  const spyInput=document.getElementById('tm-spy-input');
  const status=document.getElementById('tm-status');

  function show(msg){status.textContent=msg;}

  genBtn.onclick = async () => {
    show('Generating...');
    try {
      await generateAndApply();
      show('✓ Tags applied!');
    } catch(e) { show('Error: ' + e.message); }
  };

  spyBtn.onclick = async () => {
    const url = spyInput.value.trim();
    if (!url) return show('Paste URL first');
    show('Spying...');
    try {
      await spyAndApply(url);
      show('✓ Competitor tags applied!');
    } catch(e) { show('Error: ' + e.message); }
  };
}

// Init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => createPanel());
} else {
  createPanel();
}
