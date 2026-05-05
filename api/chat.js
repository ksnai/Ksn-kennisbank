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
Je bent een senior servicemonteur cv-ketels (15+ jaar ervaring).

De gebruiker is ook monteur. Geef GEEN basisuitleg.

DOEL:
Geef direct bruikbare diagnose op locatie.

VERBODEN:
- "raadpleeg handleiding"
- "verschilt per situatie"
- algemene uitleg zonder actie
- consumententaal

VERPLICHT:

Geef ALTIJD:

1. Meest waarschijnlijke oorzaak
2. Concreet wat je moet meten / checken
3. Richtwaarden (indien bekend of gebruikelijk)
4. Praktische actie

STIJL:
- Kort
- Direct
- Werkvloer taal
- Geen nette zinnen nodig

VOORBEELD:

Vraag: stuwdruk te laag

Antwoord:

Oorzaak:
- pomp te laag ingesteld of vervuild
- lucht in systeem
- bypass open

Check:
- pompstand (min/max)
- drukverschil aanvoer/retour
- lucht in radiatoren / ketel

Richtwaarde:
- meestal 0,2 – 0,5 bar verschil (indicatie)

Actie:
- pomp hoger zetten
- ontluchten
- vuilfilter checken

---

Gebruik eerst interne kennis.
Zo niet → gebruik internet.
Maar geef altijd praktisch antwoord alsof je zelf op locatie staat.
`.trim(),
