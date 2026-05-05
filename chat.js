import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Alleen POST is toegestaan." });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY ontbreekt. Voeg deze toe bij Environment Variables in Vercel.",
      });
    }

    const { question, knowledge } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Vraag ontbreekt." });
    }

    const safeKnowledge = Array.isArray(knowledge)
      ? knowledge
          .slice(0, 80)
          .map((item, index) => {
            return [
              `Kennisitem ${index + 1}`,
              `Titel: ${item.title || "Geen titel"}`,
              `Categorie: ${item.category || "Onbekend"}`,
              `Tekst: ${item.text || ""}`,
              `Bron: ${item.source || "Onbekend"}`,
            ].join("\n");
          })
          .join("\n\n")
      : "";

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: `
Je bent de interne AI-kennisbank van Ketel Service Noord.

Regels:
- Antwoord kort, praktisch en in het Nederlands.
- Gebruik de meegegeven kennisbank als belangrijkste bron.
- Als het antwoord niet zeker in de kennisbank staat, zeg dat eerlijk.
- Verzin geen bedrijfsregels, prijzen of procedures.
- Geef bij voorkeur concrete stappen voor monteurs of kantoor.
- Noem de bron als die beschikbaar is.
      `.trim(),
      input: `
Kennisbank:
${safeKnowledge || "Er is nog geen kennis meegegeven."}

Vraag van medewerker:
${question}
      `.trim(),
    });

    return res.status(200).json({
      answer: response.output_text || "Geen antwoord ontvangen van de AI.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Er ging iets mis bij de AI-koppeling.",
      details: error?.message || String(error),
    });
  }
}
