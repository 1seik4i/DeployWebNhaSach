/**
 * Translation Service for Vietnamese -> English (and vice versa)
 * Primary method: Google Translate Free API (GTX) - fast, high quality, zero configuration, no API key needed.
 * Optional enhancement: Google Gemini API (GEMINI_API_KEY) if configured in .env.
 * Fail-safe: Always returns the original text if network or service is unreachable, never throwing errors that disrupt user workflows.
 */

export async function translateViToEn(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Optional: Gemini API if key is provided in .env
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a professional literary translator. Translate the following Vietnamese text to natural, elegant English suitable for a book street and cultural platform. Return ONLY the English translation without quotes or markdown:\n\n${trimmed}`,
              }],
            }],
          }),
          signal: AbortSignal.timeout(5000),
        },
      );
      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) return translated;
      }
    } catch {
      // Fall through to Google Translate GTX
    }
  }

  // Google Translate GTX endpoint (Free, fast, reliable)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        return data[0].map((chunk) => chunk[0]).join('');
      }
    }
  } catch (err) {
    console.warn('[Translate] Auto-translation skipped due to network/timeout:', err.message);
  }

  // Graceful fallback: return original text if translation fails
  return trimmed;
}

/**
 * Batch translate multiple text fields
 * @param {Record<string, string>} fields
 * @returns {Promise<Record<string, string>>}
 */
export async function batchTranslateViToEn(fields) {
  const entries = Object.entries(fields);
  const results = {};
  await Promise.all(
    entries.map(async ([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        results[key] = await translateViToEn(value);
      } else {
        results[key] = value || '';
      }
    }),
  );
  return results;
}
