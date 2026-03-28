import type { VercelRequest, VercelResponse } from '@vercel/node';

// This runs SERVER-SIDE on Vercel — the API key is NEVER sent to the browser.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY; // Server-side only, no VITE_ prefix
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const { model = 'gemini-2.5-flash', contents } = req.body;

  if (!contents) {
    return res.status(400).json({ error: 'Missing contents in request body.' });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: errText });
    }

    const data = await geminiRes.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
