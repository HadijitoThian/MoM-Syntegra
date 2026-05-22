const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

const SYSTEM_PROMPT = `You are an expert meeting-notes writer for Indonesian SME owners,
consultants, lawyers, and agency owners. You write concise, business-focused notes.

Detect the meeting's primary language (Bahasa Indonesia or English) from the transcript
and write ALL summary fields in that same language. Action items should name an owner
when one is clear from context (use "team" otherwise). Dates must be ISO 8601 (YYYY-MM-DD)
when the meeting mentions a deadline; otherwise null.

Output STRICT JSON only, no markdown fences, no preamble.`;

const USER_TEMPLATE = ({ transcript, flagged, durationMin }) => `Below is a transcript of a meeting that lasted ${durationMin} minutes.

${flagged?.length ? `The user flagged these moments as important during the meeting:\n${flagged.map((f) => `- ${formatTime(f.time_sec)} (${f.kind}): ${f.label}`).join('\n')}\n\n` : ''}TRANSCRIPT:
"""
${transcript}
"""

Produce a JSON object with EXACTLY these fields:
{
  "title": "Short meeting title (max 60 chars, in the meeting's language)",
  "overview": "2-3 sentence summary in the meeting's language",
  "action_items": [
    { "owner": "Name or 'team'", "task": "concrete next action", "due": "YYYY-MM-DD or null" }
  ],
  "key_decisions": ["..."],
  "next_steps": ["..."],
  "mind_map_mermaid": "mindmap\\n  root((Topic))\\n    Branch1\\n      Detail"
}

Rules:
- mind_map_mermaid MUST be valid Mermaid mindmap syntax. Start with "mindmap" on its own line.
- 1 root node, 3-6 main branches, 1-3 leaves per branch. Keep node labels short (under 40 chars).
- action_items, key_decisions, next_steps may be empty arrays if nothing applies.
- Output STRICT JSON only, no markdown fences, no preamble.`;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Tolerant JSON parser — strips ```json fences, slices from first { to last }.
function parseStrict(text) {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('claude_no_json_object');
  return JSON.parse(t.slice(first, last + 1));
}

export async function summariseTranscript({ transcript, flagged, durationSeconds }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
  if (!transcript || !transcript.trim()) throw new Error('empty_transcript');

  const durationMin = Math.max(1, Math.round((durationSeconds || 0) / 60));

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_TEMPLATE({ transcript, flagged, durationMin }) }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`claude_failed_${res.status}: ${body}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  const parsed = parseStrict(text);

  // Light validation; default missing fields to safe shapes.
  return {
    title: String(parsed.title || '').slice(0, 80) || null,
    overview: parsed.overview || '',
    action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
    key_decisions: Array.isArray(parsed.key_decisions) ? parsed.key_decisions : [],
    next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
    mind_map_mermaid: parsed.mind_map_mermaid || 'mindmap\n  root((Meeting))',
  };
}
