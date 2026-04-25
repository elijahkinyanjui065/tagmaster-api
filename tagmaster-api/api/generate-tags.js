/* TagMaster Pro — content.js FINAL (with strict audience control flow) */

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

// ── SANITIZE FOR ZAZZLE ──────────────────────────────────────
function sanitizeForZazzle(tags) {
  return tags
   .map(t => t.toLowerCase().trim().replace(/[&#]/g, ''))
   .filter(t => t.length >= 2 && t.length <= 20)
   .filter((t, i, arr) => arr.indexOf(t) === i)
   .slice(0, 10);
}

// ── STRICT TAG BUILDER (audience control flow) ───────────────
function buildTags(title) {
  const raw = (title || '').toLowerCase().trim();

  // detectors (simplified for brevity)
  function detectOccasion(t){ if(t.includes('easter'))return'easter'; if(t.includes('birthday'))return'birthday'; if(t.includes('christmas'))return'christmas'; if(t.includes('wedding'))return'wedding'; if(t.includes('halloween'))return'halloween'; if(t.includes('baby'))return'baby'; return null;}
  function detectStyle(t){ if(t.includes('floral'))return'floral'; if(t.includes('cute'))return'cute'; if(t.includes('vintage'))return'vintage'; if(t.includes('colorful'))return'colorful'; return null;}
  function detectProductType(t){ if(t.includes('shirt')||t.includes('tee'))return'tshirt'; if(t.includes('mug'))return'mug'; if(t.includes('poster'))return'poster'; if(t.includes('card'))return'card'; return 'design';}
  function detectAudience(t){ if(t.includes('kid')||t.includes('child')||t.includes('baby')||t.includes('bunny'))return'kids'; if(t.includes('women')||t.includes('girl')||t.includes('her')||t.includes('mom'))return'women'; if(t.includes('men')||t.includes('boy')||t.includes('him')||t.includes('dad'))return'men'; return 'general';}

  const occasion = detectOccasion(raw);
  const style = detectStyle(raw);
  const product = detectProductType(raw);
  const audience = detectAudience(raw);

  function isValidTag(tag){ if(!tag)return false; const words=tag.split(/\s+/); return words.length>=2 && words.length<=3 && tag.length>=3 && tag.length<=24; }

  const out = [];

  // 1. PRIMARY
  const primary = raw.split(/\s+/)[0] || 'design';
  const primaryProduct = `${primary} ${product}`.trim();
  if(isValidTag(primaryProduct)) out.push(primaryProduct);

  // 2. STRICT AUDIENCE BRANCH
  if(audience==='kids'){
    out.push('gift for kids');
    if(product) out.push(`kids ${product}`);
  } else if(audience==='women'){
    out.push('gift for her');
    if(product) out.push(`women ${product}`);
  } else if(audience==='men'){
    out.push('gift for him');
    if(product) out.push(`men ${product}`);
  } else {
    // general
    out.push('gift for her'); // safe fallback only
  }

  // 3. SEARCH COMBOS
  if(occasion) out.push(`${primary} ${occasion}`);
  if(style) out.push(`${primary} ${style}`);
  if(style && occasion) out.push(`${style} ${occasion}`);

  // 4. LONG-TAIL
  if(style && occasion && product) out.push(`${style} ${occasion} ${product}`);
  if(style && product) out.push(`${style} ${product}`);
  if(occasion && product) out.push(`${occasion} ${product}`);

  // Fill to 10
  while(out.length<10) out.push(primaryProduct);

  return [...new Set(out)].slice(0,10);
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
  try { data = await callAPI({ title }); }
  catch { data = { tags: buildTags(title) }; }

  let tags = data.tags || [];
  if (!tags.length) tags = buildTags(title);

  tags = sanitizeForZazzle(tags);

  const filled = await fillTags(tags);
  if (!filled) {
    await navigator.clipboard.writeText(tags.join(', ')).catch(() => {});
    throw new Error('Tag field not found — tags copied to clipboard.');
  }
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

// ── PANEL + INIT (unchanged) ─────────────────────────────────
function createPanel(container) {
  if (document.getElementById('tm-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'tm-panel';
  panel.innerHTML = `
    <button id="tm-gen-btn">Generate Tags</button>
    <input id="tm-spy-input" placeholder="Paste competitor Zazzle URL">
    <button id="tm-spy-btn">Competitor Tags</button>
    <div id="tm-status"></div>
  `;
  container.appendChild(panel);

  const genBtn=document.getElementById('tm-gen-btn');
  const spyBtn=document.getElementById('tm-spy-btn');
  const spyInput=document.getElementById('tm-spy-input');
  const status=document.getElementById('tm-status');

  function show(msg){status.textContent=msg;}
  genBtn
