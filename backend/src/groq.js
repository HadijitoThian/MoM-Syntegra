import FormData from 'form-data';

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3';

export async function transcribeAudio({ buffer, filename, mimeType, languageHint }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');

  const form = new FormData();
  form.append('file', buffer, { filename: filename || 'audio.webm', contentType: mimeType || 'audio/webm' });
  form.append('model', MODEL);
  form.append('response_format', 'verbose_json');
  if (languageHint) form.append('language', languageHint);
  form.append('temperature', '0');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, ...form.getHeaders() },
    body: form.getBuffer(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`groq_failed_${res.status}: ${body}`);
  }
  const data = await res.json();
  return {
    text: data.text || '',
    language: data.language || null,
    duration: data.duration || null,
    raw: data,
  };
}
