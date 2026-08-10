// Proxies plant photo identification to Pl@ntNet (my.plantnet.org) so the free
// API key stays server-side and never reaches the client bundle.
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed.' }) };
  }

  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Plant identification is not configured yet (missing PLANTNET_API_KEY).' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  const { image, organ } = payload;
  if (!image || typeof image !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'No image provided.' }) };
  }

  const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Image must be a base64 data URL.' }) };
  }
  const [, mime, base64Data] = match;
  const bytes = Buffer.from(base64Data, 'base64');
  const blob = new Blob([bytes], { type: mime });

  const validOrgans = ['leaf', 'flower', 'fruit', 'bark', 'other'];
  const form = new FormData();
  form.append('images', blob, 'photo.jpg');
  form.append('organs', validOrgans.includes(organ) ? organ : 'leaf');

  let response;
  try {
    response = await fetch(`https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`, {
      method: 'POST',
      body: form,
    });
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not reach the identification service.' }) };
  }

  if (!response.ok) {
    let message = `Identification service returned ${response.status}.`;
    try {
      const errBody = await response.json();
      if (errBody && errBody.message) message = errBody.message;
    } catch {}
    return { statusCode: response.status, body: JSON.stringify({ error: message }) };
  }

  const data = await response.json();
  const results = (data.results || []).slice(0, 5).map(r => ({
    score: Math.round((r.score || 0) * 100),
    scientificName: (r.species && r.species.scientificNameWithoutAuthor) || 'Unknown',
    commonNames: (r.species && r.species.commonNames) || [],
    family: (r.species && r.species.family && r.species.family.scientificNameWithoutAuthor) || '',
    image: (r.images && r.images[0] && r.images[0].url && (r.images[0].url.s || r.images[0].url.m)) || null,
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results }),
  };
};
