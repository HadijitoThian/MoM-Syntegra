function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function buildMeetingEmail({ user, meeting, summary, viewUrl }) {
  const dateStr = new Date(meeting.created_at).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const subject = `📝 Catatan Rapat: ${summary.title || 'Meeting'} — ${dateStr}`;

  const actions = (summary.action_items || []).map((a) => {
    const due = a.due ? ` — <em>due ${esc(a.due)}</em>` : '';
    return `<li><strong>${esc(a.owner || 'team')}:</strong> ${esc(a.task)}${due}</li>`;
  }).join('');

  const decisions = (summary.key_decisions || []).map((d) => `<li>${esc(d)}</li>`).join('');
  const nextSteps = (summary.next_steps || []).map((d) => `<li>${esc(d)}</li>`).join('');

  const greeting = user.full_name ? `Halo ${esc(user.full_name)},` : 'Halo,';

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="margin:0 0 4px 0;">📝 ${esc(summary.title || 'Meeting')}</h2>
  <p style="color:#64748b;margin:0 0 24px 0;font-size:13px;">${esc(dateStr)} · ${Math.round(meeting.duration_seconds / 60)} menit</p>
  <p>${greeting}</p>
  <p>Berikut catatan rapat Anda:</p>
  <h3 style="margin-top:24px;">Ringkasan</h3>
  <p>${esc(summary.overview)}</p>
  ${actions ? `<h3>Action Items</h3><ul>${actions}</ul>` : ''}
  ${decisions ? `<h3>Keputusan Penting</h3><ul>${decisions}</ul>` : ''}
  ${nextSteps ? `<h3>Langkah Selanjutnya</h3><ul>${nextSteps}</ul>` : ''}
  <p style="margin-top:32px;">
    <a href="${esc(viewUrl)}" style="background:#0f172a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">
      Lihat rapat lengkap →
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px 0;">
  <p style="color:#94a3b8;font-size:12px;">Dikirim oleh Syntegra MoM · mom.syntegra.co.id</p>
</body></html>`;

  const text = [
    `${summary.title || 'Meeting'} — ${dateStr}`,
    '',
    greeting,
    '',
    'Ringkasan:',
    summary.overview,
    '',
    (summary.action_items || []).length ? 'Action Items:' : '',
    ...(summary.action_items || []).map((a) => `- ${a.owner || 'team'}: ${a.task}${a.due ? ` (due ${a.due})` : ''}`),
    '',
    (summary.key_decisions || []).length ? 'Keputusan Penting:' : '',
    ...(summary.key_decisions || []).map((d) => `- ${d}`),
    '',
    `Lihat rapat lengkap: ${viewUrl}`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}
