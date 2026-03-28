/**
 * Calls the Gemini API through our secure server-side proxy at /api/gemini.
 * The real API key NEVER touches the browser — it lives only in Vercel env vars.
 *
 * @param contents  - Array of Gemini "Content" parts (text and/or inlineData)
 * @param model     - Gemini model name (defaults to gemini-2.5-flash)
 * @returns         - The raw text response from Gemini
 */
export async function callGemini(
  contents: Array<{
    role?: string;
    parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>;
  }>,
  model = 'gemini-2.5-flash'
): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, contents }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Gemini proxy error: ${res.status}`);
  }

  const data = await res.json();
  // Extract text from the standard Gemini response shape
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini.');
  return text;
}
