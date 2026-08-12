// Stores per-plant "growth timeline" photos (seedling -> maturity) in Netlify
// Blobs. Viewing is public (matches the rest of the catalogue); adding or
// removing a photo requires the TIMELINE_UPLOAD_PIN env var as a shared secret,
// so the live site can't be spammed by anyone who finds the URL.
import { getStore } from '@netlify/blobs';

const STAGES = ['Seedling', 'Sprouting', 'Vegetative', 'Flowering', 'Fruiting', 'Mature'];

function json(statusCode, data) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

function checkPin(event) {
  const expected = process.env.TIMELINE_UPLOAD_PIN;
  if (!expected) return 'Growth photo uploads are not configured yet (missing TIMELINE_UPLOAD_PIN).';
  const got = event.headers['x-upload-pin'] || event.headers['X-Upload-Pin'];
  if (got !== expected) return 'Incorrect PIN.';
  return null;
}

async function getIndex(store, plantId) {
  const index = (await store.get(`index/${plantId}`, { type: 'json' })) || [];
  index.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return index;
}

export const handler = async (event) => {
  const store = getStore('growth-timeline');
  const params = event.queryStringParameters || {};
  const plantId = params.plantId;

  if (event.httpMethod === 'GET' && params.action === 'photo') {
    if (!plantId || !params.ts) return json(400, { error: 'plantId and ts required.' });
    const bytes = await store.get(`photo/${plantId}/${params.ts}`, { type: 'arrayBuffer' });
    if (!bytes) return { statusCode: 404, body: 'Not found' };
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
      body: Buffer.from(bytes).toString('base64'),
      isBase64Encoded: true,
    };
  }

  if (event.httpMethod === 'GET') {
    if (!plantId) return json(400, { error: 'plantId required.' });
    return json(200, { entries: await getIndex(store, plantId) });
  }

  if (event.httpMethod === 'POST') {
    const pinError = checkPin(event);
    if (pinError) return json(401, { error: pinError });

    let payload;
    try { payload = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }
    const { plantId: pid, stage, date, image } = payload;
    if (!pid) return json(400, { error: 'plantId required.' });
    if (!STAGES.includes(stage)) return json(400, { error: 'Invalid growth stage.' });
    if (!image || typeof image !== 'string') return json(400, { error: 'No image provided.' });

    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return json(400, { error: 'Image must be a base64 data URL.' });
    const [, , base64Data] = match;
    const bytes = Buffer.from(base64Data, 'base64');

    const ts = Date.now();
    const entry = { ts, stage, date: date || new Date(ts).toISOString().slice(0, 10) };

    await store.set(`photo/${pid}/${ts}`, bytes);
    const index = (await store.get(`index/${pid}`, { type: 'json' })) || [];
    index.push(entry);
    await store.setJSON(`index/${pid}`, index);

    return json(200, { entry });
  }

  if (event.httpMethod === 'DELETE') {
    const pinError = checkPin(event);
    if (pinError) return json(401, { error: pinError });

    let payload;
    try { payload = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }
    const { plantId: pid, ts } = payload;
    if (!pid || !ts) return json(400, { error: 'plantId and ts required.' });

    await store.delete(`photo/${pid}/${ts}`);
    const index = (await store.get(`index/${pid}`, { type: 'json' })) || [];
    const next = index.filter((e) => e.ts !== ts);
    await store.setJSON(`index/${pid}`, next);

    return json(200, { entries: next });
  }

  return json(405, { error: 'Method not allowed.' });
};
