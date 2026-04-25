// api/generate-tags.js  (Vercel serverless handler example)

const TRADEMARKS = [ /* your trademark list here */ ];

// Minimal local fallback generator (keeps response deterministic)
function localFallbackTags(title = '') {
  const raw = (title || '').toLowerCase().trim();
  const words = raw.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const primary = words[0] || 'design';
  const product = words.find(w => /(shirt|mug|poster|card|sticker|tote|pillow|invitation)/.test(w)) || 'design';
  const out = [
    `${primary} ${product}`,
    `${primary} gift`,
    `gift for her`,
    `gift for kids`,
    `${primary} ${product}`,
    `${primary} design`,
    `${primary} ${product}`,
    `${primary} ${product}`,
    `${primary} ${product}`,
    `${primary} ${product}`
  ].slice(0, 10);
  return out;
}

// Optional: simple trademark filter (keeps server-side safety)
function ipFilter(tags = []) {
  try {
    return tags.filter(tag => {
      if (!tag) return false;
      const t = tag.toLowerCase();
      if (t.length < 2) return false;
      return !TRADEMARKS.some(tm => t.includes(tm));
    });
  } catch (e) {
    return tags;
  }
}

// Helper: consistent JSON response
function jsonResponse(res, status = 200, payload = {}) {
  res.status(status).json(payload);
}

// Exported handler
export default async function handler(req, res) {
  // 1) CORS headers first, always
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2) Wrap everything in try/catch so we never crash without a response
  try {
    if (req.method !== 'POST') {
      return jsonResponse(res, 405, { success: false, error: 'Method not allowed' });
    }

    const body = req.body || {};
    const title = (body.title || '').toString().trim();
    const spyUrl = (body.spyUrl || '').toString().trim();

    if (!title && !spyUrl) {
      return jsonResponse(res, 200, { success: false, tags: [], error: 'Missing title or spyUrl' });
    }

    // If you have a buildTags function defined elsewhere, call it safely.
    // If it throws or is undefined, fall back to localFallbackTags.
    let tags = [];
    try {
      if (typeof buildTags === 'function') {
        tags = buildTags(title || spyUrl);
      } else {
        // buildTags not defined — use local fallback
        tags = localFallbackTags(title || spyUrl);
      }
    } catch (innerErr) {
      console.error('buildTags error, using fallback:', innerErr && innerErr.message);
      tags = localFallbackTags(title || spyUrl);
    }

    // Server-side sanitize: lowercase, trim, remove bad chars, dedupe, limit 10
    tags = tags
      .map(t => (t || '').toLowerCase().trim().replace(/[&#]/g, ''))
      .filter(t => t && t.length >= 2 && t.length <= 24)
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .slice(0, 10);

    // Trademark filter
    tags = ipFilter(tags);

    // Final safety: ensure exactly 10 tags by deterministic backfill
    const filler = tags[0] || (title ? `${title.split(/\s+/)[0]} design` : 'design');
    while (tags.length < 10) tags.push(filler);

    return jsonResponse(res, 200, { success: true, tags, count: tags.length });

  } catch (err) {
    // 3) Catch-all: log and return safe JSON (never crash)
    console.error('API handler error:', err && err.stack ? err.stack : err);
    return jsonResponse(res, 200, { success: false, tags: [], error: 'internal_error' });
  }
}
