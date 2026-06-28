// Optional LLM enrichment. Entirely opt-in: with no ANTHROPIC_API_KEY set,
// isAiConfigured() is false and callers fall back to the deterministic
// heuristics in lib/ai-assist.ts. Every call here is defensively wrapped so a
// network/API failure degrades to null rather than breaking the request — the
// AI layer can never take down a feature that works fine without it.

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

interface FormatAdviceContext {
  sport: string;
  teamCount: number;
  entryType: string;
}

// Returns a short natural-language recommendation, or null if AI isn't
// configured or the call fails (caller then shows the heuristic rationale).
export async function generateFormatAdvice(ctx: FormatAdviceContext): Promise<string | null> {
  if (!isAiConfigured()) return null;

  const prompt = `You are a tournament operations assistant. In 2-3 sentences, recommend a bracket format (single elimination, round robin, double elimination, or Swiss) for a ${ctx.sport} tournament with ${ctx.teamCount} ${ctx.entryType === 'TEAM' ? 'teams' : 'players'}. Be concrete about why. Note that only single elimination and round robin are currently available to run.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-latest',
        max_tokens: 250,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    const text = data?.content?.[0]?.text;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}
