export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, spyUrl } = req.body;

  // Spy mode - fake competitor tags
  if (spyUrl) {
    const fakeSpyTags = [
      "competitor tag 1", "competitor tag 2", "best seller gift",
      "trending product", "popular item", "top rated",
      "customer favorite", "hot item", "must have",
      "viral product", "amazon choice", "etsy bestseller", "tiktok viral"
    ];
    return res.status(200).json({ success: true, spyTags: fakeSpyTags });
  }

  // Generate mode - fake tags based on title
  if (!title || title.length < 3) {
    return res.status(400).json({ error: 'Title too short' });
  }

  const fakeTags = [
    `${title.toLowerCase()} gift`,
    `funny ${title.toLowerCase()}`,
    `${title.toLowerCase()} birthday`,
    `unique ${title.toLowerCase()}`,
    `${title.toLowerCase()} for her`,
    `${title.toLowerCase()} for him`,
    `custom ${title.toLowerCase()}`,
    `${title.toLowerCase()} present`,
    `best ${title.toLowerCase()}`,
    `${title.toLowerCase()} idea`,
    `cool ${title.toLowerCase()}`,
    `${title.toLowerCase()} lover`,
    `new ${title.toLowerCase()}`
  ];

  return res.status(200).json({ success: true, tags: fakeTags });
}
