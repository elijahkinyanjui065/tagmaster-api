// ================================================
// ZAZZLE TAGMASTER API v3.2 – FULL MASTER ENGINE
// CORS FIXED + NON-ROBOTIC TAGS (April 2026)
// ================================================

const TRADEMARKS = [
  'disney','marvel','pokemon','nintendo','barbie','hello kitty','star wars',
  'harry potter','minecraft','fortnite','pixar','dreamworks','nickelodeon',
  'lego','superman','batman','spiderman','avengers','frozen','moana',
  'star trek','lord of the rings','dc comics','mickey','minnie'
];

function ipFilter(tags = []) {
  const blocked = [];
  const safe = tags.filter(tag => {
    if (!tag) return false;
    const t = tag.toLowerCase();
    const hit = TRADEMARKS.some(tm => t.includes(tm));
    if (hit) blocked.push(tag);
    return !hit;
  });
  return { safe, blocked };
}

// ---------- TAG BUILDER v3.2 – FULL MASTER ENGINE (non-robotic) ----------
function buildTags(title) {
  const raw = (title || '').toLowerCase().trim();

  // ── PHASE 0: MANDATORY PRODUCT ANALYSIS ─────────────────────────────────────
  function detectOccasion(text) {
    const s = text.toLowerCase();
    if (s.includes('easter')) return 'Easter';
    if (s.includes('birthday')) return 'Birthday';
    if (s.includes('christmas')) return 'Christmas';
    if (s.includes('wedding') || s.includes('bride') || s.includes('groom')) return 'Wedding';
    if (s.includes('halloween')) return 'Halloween';
    if (s.includes('graduation') || s.includes('grad')) return 'Graduation';
    if (s.includes('fathers day') || s.includes('father\'s')) return 'Fathers Day';
    if (s.includes('mothers day') || s.includes('mother\'s')) return 'Mothers Day';
    if (s.includes('baby') || s.includes('shower')) return 'Baby Shower';
    return null;
  }

  function detectStyle(text) {
    const s = text.toLowerCase();
    const styles = {
      watercolor: 'Watercolor', floral: 'Floral', vintage: 'Vintage',
      boho: 'Boho', minimalist: 'Minimalist', retro: 'Retro',
      sarcastic: 'Sarcastic', funny: 'Funny', cute: 'Cute',
      modern: 'Modern', rustic: 'Rustic', abstract: 'Abstract',
      geometric: 'Geometric', pastel: 'Pastel', colorful: 'Colorful',
      elegant: 'Elegant', whimsical: 'Whimsical'
    };
    for (const [key, val] of Object.entries(styles)) {
      if (s.includes(key)) return val;
    }
    if (s.includes('cute') || s.includes('adorable')) return 'Cute';
    if (s.includes('funny') || s.includes('sarcastic')) return 'Sarcastic';
    return 'Stylish';
  }

  function detectAudience(text) {
    const s = text.toLowerCase();
    if (s.includes('nurse') || s.includes('nurses')) return 'Nurses';
    if (s.includes('teacher') || s.includes('teachers')) return 'Teachers';
    if (s.includes('mom') || s.includes('mum') || s.includes('mothers')) return 'Moms';
    if (s.includes('dad') || s.includes('fathers')) return 'Dads';
    if (s.includes('kid') || s.includes('child') || s.includes('baby') || s.includes('toddler')) return 'Kids';
    if (s.includes('women') || s.includes('her') || s.includes('girl')) return 'Women';
    if (s.includes('men') || s.includes('him') || s.includes('boy')) return 'Men';
    if (s.includes('dog') || s.includes('cat') || s.includes('pet')) return 'Pet Lovers';
    return 'Everyone';
  }

  function detectCategory(text) {
    const s = text.toLowerCase();
    if (s.includes('card') || s.includes('invitation') || s.includes('invite') || s.includes('stationery')) return 'Stationery/Cards';
    if (s.includes('
