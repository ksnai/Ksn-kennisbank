import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Alleen POST toegestaan" });
  }

  try {
    const { question, knowledge } = req.body;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: `
Je bent de interne kennisbank van Ketel Service Noord.

Gebruik deze kennis:
${JSON.stringify(knowledge)}

Vraag:
${question}
      `,
    });

    res.status(200).json({
      answer: response.output_text,
    });

  } catch (error) {
    res.status(500).json({
      error: "AI fout",
      details: error.message,
    });
  }
}
