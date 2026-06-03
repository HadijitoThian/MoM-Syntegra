// Thin Resend wrapper. In dev (no RESEND_API_KEY) we log instead of sending.
const RESEND_API = 'https://api.resend.com/emails';

function encodeHeader(value) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

export async function sendEmail({ to, subject, html, text }) {
  const from = process.env.FROM_EMAIL || 'noreply@syntegra.co.id';
  const replyTo = process.env.REPLY_TO_EMAIL || undefined;
  const key = process.env.RESEND_API_KEY;
  const encodedSubject = encodeHeader(subject);

  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set — logging instead of sending. To=${to}`);
    console.log('[email:dev] To:', to);
    console.log('[email:dev] Subject:', encodedSubject);
    console.log('[email:dev] Body:', text || html);
    return { dev: true, sent: false, reason: 'no_resend_key' };
  }

  console.log(`[email] sending: from=${from} to=${to} subject="${subject.slice(0, 60)}"`);
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: encodedSubject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`[email] FAILED status=${res.status} body=${body.slice(0, 300)}`);
    throw new Error(`resend_failed_${res.status}: ${body.slice(0, 200)}`);
  }
  const data = JSON.parse(body);
  console.log(`[email] sent ok id=${data.id}`);
  return { sent: true, ...data };
}
