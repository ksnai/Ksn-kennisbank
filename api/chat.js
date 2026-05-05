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

    if (!question) {
      return res.status(400).json({ error: "Geen vraag ontvangen" });
    }

    // Interne kennis netjes maken
    const safeKnowledge = Array.isArray(knowledge)
      ? knowledge
          .slice(0, 80)
          .map((item, index) => {
            return [
              `Kennisitem ${index + 1}`,
              `Titel: ${item.title || "Geen titel"}`,
              `Categorie: ${item.category || "Onbekend"}`,
              `Tekst: ${item.text || ""}`,
            ].join("\n");
          })
          .join("\n\n")
      : "";

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",

      // 🔥 HYBRIDE: internet + eigen kennis
      tools: [
        {
          type: "web_search",
        },
      ],

      instructions: `
Je bent de technische AI-assistent voor monteurs van Ketel Service Noord.

BELANGRIJK:
- De gebruiker is installateur / servicemonteur
- Geen consumententaal
- Geen standaard "bel een monteur" (de gebruiker IS de monteur)

WERKWIJZE:
1. Gebruik eerst interne kennis
2. Onvoldoende info → gebruik internet
3. Geef technische diagnose, geen algemene uitleg

ANTWOORD STRUCTUUR:

1. Oorzaak (meest waarschijnlijk)
2. Controlepunten (concreet meten / checken)
3. Oplossing / actie
4. Veiligheid (alleen indien relevant)

REGELS:
- Kort en technisch
- Geen bullshit
- Geen vage teksten
- Geen marketingtaal
- Geen verzonnen waarden
- Bij twijfel: zeg dat eerlijk

VOORBEELD STIJL:

E36 → rookgasprobleem

Controle:
- rookgasafvoer op blokkade
- ventilator rpm / werking
- luchtdrukverschil
- condensafvoer vrij

Actie:
- afvoer reinigen / herstellen
- ventilator controleren/vervangen
- reset na herstel

Alleen bij echt gevaar:
→ installatie uitschakelen
      `.trim(),

      input: `
Interne kennis:
${safeKnowledge || "Geen interne kennis beschikbaar"}

Vraag:
${question}
      `.trim(),
    });

    res.status(200).json({
      answer: response.output_text || "Geen antwoord",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "AI fout",
      details: error.message,
    });
  }
}
