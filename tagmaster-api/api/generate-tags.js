// ---------- UNIVERSAL TAG FORMULA (category‑agnostic) - IMPROVED ----------

// Start fresh for this layer
const out = []; // replace or ensure this is the array you use for tags

// Local helper to add a tag deterministically (no duplicates, validated)
function addTag(tag) {
  if (!tag || typeof tag !== 'string') return false;
  const s = tag.toLowerCase().trim().replace(/\s+/g, ' ');
  if (!isValidTag(s)) return false;
  if (out.includes(s)) return false;
  out.push(s);
  return true;
}

// Deterministic primaryProduct (tag #1)
const primaryProduct = product && isValidTag(`${primary} ${product}`)
  ? `${primary} ${product}`.toLowerCase()
  : `${primary} design`.toLowerCase();
addTag(primaryProduct);

// 2. BUYER‑INTENT LAYER (must have at least 2)
if (occasion) {
  addTag(`${occasion} gift`);
}

// Audience‑specific gift (never "gift for general")
if (audience === 'kids') {
  addTag('gift for kids');
} else if (audience === 'men' || audience === 'dad') {
  addTag('gift for him');
  if (occasion && audience !== 'kids') addTag(`${occasion} for him`);
} else if (audience === 'women' || audience === 'mom') {
  addTag('gift for her');
  if (occasion && audience !== 'kids') addTag(`${occasion} for her`);
} else {
  // neutral fallback (deterministic)
  addTag('gift for him');
}

// Ensure at least 2 gift-intent tags (deterministic fallback)
const giftCount = out.filter(x => x.includes('gift')).length;
if (giftCount < 2) {
  const secondGift = audience === 'men' ? 'gift for him'
                    : audience === 'women' ? 'gift for her'
                    : 'gift for him';
  addTag(secondGift);
}

// 3. AUDIENCE + PRODUCT (if audience exists and not general)
if (audience && audience !== 'general' && product) {
  addTag(`${audience} ${product}`);
}

// 4. SEARCH COMBOS (core buyer queries)
if (occasion) addTag(`${primary} ${occasion}`);
if (style) addTag(`${primary} ${style}`);
if (style && occasion) addTag(`${style} ${occasion}`);

// 5. LONG‑TAIL / OCCASION‑STYLE‑PRODUCT
if (style && occasion && product) addTag(`${style} ${occasion} ${product}`);
if (style && product) addTag(`${style} ${product}`);
if (occasion && product) addTag(`${occasion} ${product}`);

// 6. NICHE / EXTRA‑IDENTITY (1–2 max)
if (foundIcon) {
  // icon + product
  addTag(product ? `${foundIcon} ${product}` : `${foundIcon} ${occasion || 'design'}`);
  // occasion + icon + product (only if it passes validation)
  if (occasion && product) addTag(`${occasion} ${foundIcon} ${product}`);
}

// 7. UTILITY‑STYLE FOR NON‑GIFT CATEGORIES
if (product === 'card' || product === 'invitation' || product === 'label') {
  addTag(`${product} design`);
  addTag(`${product} template`);
  // Only add a gift tag if title hints at gift
  if (t.includes('gift') || t.includes('her') || t.includes('him')) {
    const safeGift = audience === 'men' ? 'gift for him'
                      : audience === 'women' ? 'gift for her'
                      : 'gift for him';
    addTag(safeGift);
  }
}

// FINALIZE: Deduplicate already handled by addTag; ensure exactly 10 tags

// Deterministic filler (primaryProduct is preferred)
const filler = isValidTag(primaryProduct) ? primaryProduct : `${primary} design`.toLowerCase();

// If some tags were filtered out earlier, ensure we still have 10 by backfilling with filler
while (out.length < 10) {
  // allow repeated filler to reach 10 (Zazzle accepts repeats in practice; this keeps deterministic behavior)
  out.push(filler);
}

// Final safety pass: enforce constraints and trim to 10
const final = out
  .map(s => s.toLowerCase().trim().replace(/\s+/g, ' '))
  .filter(s => isValidTag(s))
  .slice(0, 10);

// If anything removed by final filter, backfill again
while (final.length < 10) final.push(filler);

// Replace your working array with final (or return final if function scope)
out.length = 0;
final.forEach(t => out.push(t));
