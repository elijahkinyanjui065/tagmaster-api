// lib/trademark-filter.js
// Zazzle Tags Master - Trademark Filter Module

const TRADEMARKS = [
  'disney','marvel','pokemon','nintendo','barbie','hello kitty','star wars',
  'harry potter','minecraft','fortnite','pixar','dreamworks','nickelodeon',
  'lego','superman','batman','spiderman','avengers','frozen','moana',
  'star trek','lord of the rings','dc comics','mickey','minnie','peppa pig',
  'paw patrol','bluey','sesame street','dr seuss'
];

export function ipFilter(tags) {
  const blocked = [];
  const safe = tags.filter(tag => {
    const t = tag.toLowerCase();
    const hit = TRADEMARKS.find(tm => t.includes(tm));
    if (hit) blocked.push({ tag, reason: hit });
    return !hit && t.length >= 3;
  });
  return { safe, blocked };
}
