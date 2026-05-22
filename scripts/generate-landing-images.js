#!/usr/bin/env node
// One-off script: generates landing-page images via DeepInfra Flux 1.1 Pro and
// saves them to frontend/public/landing/. Run once; commit the resulting JPGs.
//
//   DEEPINFRA_API_KEY=xxxxx node scripts/generate-landing-images.js
//
// The API key is read from env — never write it into the script itself.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../frontend/public/landing');
fs.mkdirSync(OUT_DIR, { recursive: true });

const KEY = process.env.DEEPINFRA_API_KEY;
if (!KEY) {
  console.error('Set DEEPINFRA_API_KEY=... and re-run.');
  process.exit(1);
}

const MODEL_ENDPOINT = 'https://api.deepinfra.com/v1/inference/black-forest-labs/FLUX-1.1-pro';

const IMAGES = [
  {
    name: 'hero',
    width: 1280,
    height: 1024,
    prompt:
      'Indonesian woman in her early 30s, warm friendly smile, business casual blazer over a t-shirt, ' +
      'sitting at a desk in a modern Jakarta co-working space, holding a smartphone and looking at it confidently, ' +
      'soft natural window light, shallow depth of field, photorealistic, candid photography, cinematic, ' +
      'editorial quality, sharp focus on the face, blurred warm bokeh background with plants and wooden textures',
  },
  {
    name: 'meeting-cafe',
    width: 1280,
    height: 896,
    prompt:
      'Three Indonesian professionals in their late 20s and 30s having an informal business meeting at a modern ' +
      'specialty coffee shop in Jakarta, two men and one woman, laptops open, notebooks and pens, a smartphone ' +
      'placed face-down on the table, warm afternoon light streaming through large windows, candid documentary ' +
      'photography style, photorealistic, natural skin tones, lifestyle editorial',
  },
  {
    name: 'consultant',
    width: 1280,
    height: 896,
    prompt:
      'Indonesian male consultant in his early 40s, neat short hair, wearing a crisp light-blue shirt with sleeves ' +
      'rolled up, taking notes during a client meeting in a modern minimalist office, listening attentively, ' +
      'softly smiling, professional but approachable, natural lighting, photorealistic, shallow depth of field, ' +
      'editorial business photography',
  },
  {
    name: 'phone-recording',
    width: 1024,
    height: 1024,
    prompt:
      'Close-up macro shot of a person\'s hands holding a modern smartphone, the screen shows a clean minimal ' +
      'voice recording interface with a single large red circular record button glowing softly, timer reading ' +
      '12:34, soft blurred warm background suggesting a meeting room with people, photorealistic, sharp focus on ' +
      'the phone screen, cinematic depth of field, product photography quality',
  },
  {
    name: 'notes-magic',
    width: 1280,
    height: 896,
    prompt:
      'Overhead flat lay photograph on a warm wooden desk: on the left a messy spiral notebook with scattered ' +
      'handwritten meeting notes and a pen, on the right a smartphone displaying a clean organized digital ' +
      'meeting summary with bullet points and action items, a cup of coffee in the upper corner, soft natural ' +
      'morning light, photorealistic, lifestyle product photography, clean composition, editorial quality',
  },
];

async function generate({ prompt, width, height, name }) {
  const outPath = path.join(OUT_DIR, `${name}.jpg`);
  if (fs.existsSync(outPath)) {
    console.log(`[skip] ${name}.jpg exists`);
    return;
  }
  console.log(`[gen]  ${name} (${width}x${height}) …`);

  const res = await fetch(MODEL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, width, height }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`deepinfra_failed_${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();

  // Response may be { image_url } as data URL, or { images: [data URL] }, or remote URL.
  let payload =
    data.image_url ||
    (Array.isArray(data.images) && data.images[0]) ||
    data.url ||
    null;
  if (!payload) throw new Error('no_image_in_response: ' + JSON.stringify(data).slice(0, 200));

  let bytes;
  if (payload.startsWith('data:')) {
    const b64 = payload.split(',')[1];
    bytes = Buffer.from(b64, 'base64');
  } else if (payload.startsWith('http')) {
    const r = await fetch(payload);
    bytes = Buffer.from(await r.arrayBuffer());
  } else {
    throw new Error('unknown_payload_format');
  }
  fs.writeFileSync(outPath, bytes);
  console.log(`[ok]   ${name}.jpg (${(bytes.length / 1024).toFixed(0)} KB)`);
}

(async () => {
  for (const spec of IMAGES) {
    try {
      await generate(spec);
    } catch (err) {
      console.error(`[fail] ${spec.name}:`, err.message);
    }
  }
  console.log('\nDone.');
})();
