// Thin Resend wrapper. In dev (no RESEND_API_KEY) we log instead of sending.
const RESEND_API = 'https://api.resend.com/emails';

function encodeHeader(value) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

export async function sendEmail({ to, subject, html, text }) {
  const from = process.env.FROM_EMAIL || 'noreply@syntegra.co.id';
  const key = process.env.RESEND_API_KEY;
  const encodedSubject = encodeHeader(subject);

  if (!key) {
    console.log('[email:dev] To:', to);
    console.log('[email:dev] Subject:', encodedSubject);
    console.log('[email:dev] Body:', text || html);
    return { dev: true };
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject: encodedSubject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`resend_failed: ${res.status} ${body}`);
  }
  return res.json();
}
