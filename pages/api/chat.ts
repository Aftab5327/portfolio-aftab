import type { NextApiRequest, NextApiResponse } from "next";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { fullPromptString } = req.body ?? {};

  if (!fullPromptString || typeof fullPromptString !== "string") {
    return res.status(400).json({ error: "Missing fullPromptString." });
  }

  if (!GEMINI_API_KEY) {
    console.log("Gemini API route missing GEMINI_API_KEY");
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: fullPromptString }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();

    console.log("Gemini API raw response", {
      ok: response.ok,
      status: response.status,
      data
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini API request failed.",
        candidates: data?.candidates ?? []
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(502).json({
        error: "Gemini returned no reply text.",
        candidates: data?.candidates ?? []
      });
    }

    return res.status(200).json(data);
  } catch (caughtError) {
    console.log("Gemini API route error", caughtError);
    return res.status(500).json({ error: "Internal server error while calling Gemini." });
  }
}
