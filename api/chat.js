import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Alleen POST toegestaan" });
  }

  try {
    const { question, knowledge } = req.body || {};

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
      tools: [
        {
          type: "web_search",
        },
      ],
      instructions: `
Je bent de hybride interne AI-kennisbank van Ketel Service Noord.

Werkwijze:
1. Gebruik eerst de interne kennisbank.
2. Als het antwoord daarin staat, gebruik die informatie.
3. Als het antwoord niet of onvoldoende in de interne kennisbank staat, mag je internet gebruiken.
4. Zeg duidelijk of het antwoord uit de interne kennisbank komt of van internet.
5. Verzin geen bedrijfsregels, prijzen of garanties.
6. Antwoord kort, praktisch en in het Nederlands.
7. Bij gaslucht, CO-risico, rookgas of twijfel: adviseer altijd een erkend monteur.
      `.trim(),
      input: `
Interne kennisbank:
${safeKnowledge || "Er is nog geen interne kennis meegegeven."}

Vraag:
${question}
      `.trim(),
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
