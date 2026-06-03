// Unified summarisation entry point. Routes to DeepSeek V4 Pro by default,
// falls back to Claude Sonnet if DeepSeek fails AND ANTHROPIC_API_KEY exists.
//
// Behaviour by env config:
//   DEEPSEEK_API_KEY only          → DeepSeek only (no fallback)
//   DEEPSEEK_API_KEY + ANTHROPIC_*  → DeepSeek primary, Claude fallback
//   ANTHROPIC_API_KEY only         → Claude only (legacy)
//   neither                        → throws

import { summariseWithDeepSeek } from './deepseek.js';
import { summariseTranscript as summariseWithClaude } from './claude.js';

export async function summarise(args) {
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  if (!hasDeepSeek && !hasClaude) {
    throw new Error('no_llm_configured: set DEEPSEEK_API_KEY or ANTHROPIC_API_KEY');
  }

  if (hasDeepSeek) {
    try {
      return await summariseWithDeepSeek(args);
    } catch (err) {
      console.warn('[llm] deepseek failed:', err.message);
      if (!hasClaude) throw err;
      console.log('[llm] falling back to claude');
      const result = await summariseWithClaude(args);
      return { ...result, _provider: 'claude_fallback', _model: 'claude-sonnet-4-5' };
    }
  }

  // Claude-only path
  const result = await summariseWithClaude(args);
  return { ...result, _provider: 'claude', _model: 'claude-sonnet-4-5' };
}
