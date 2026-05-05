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

    const safeKnowledge = Array.isArray(knowledge)
      ? knowledge
          .slice(0, 100)
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

      temperature: 0.2,

      instructions: `
Je bent de technische AI-assistent van Ketel Service Noord.

Je helpt monteurs en installateurs met cv-ketel storingen, onderhoud, diagnose en klantgerelateerde technische vragen.

BELANGRIJK:
- De gebruiker is monteur/installateur, geen consument.
- Gebruik geen consumententaal.
- Zeg niet standaard "bel een monteur", want de gebruiker is zelf monteur.
- Geef geen lange algemene uitleg.
- Geef praktische diagnose alsof je zelf naast de ketel staat.
- Verzin geen fabriekswaarden, foutcodes of onderdelen.
- Als je iets niet zeker weet: zeg dat kort en geef de beste controlevolgorde.
- Gebruik eerst interne kennis.
- Als interne kennis ontbreekt of onvoldoende is, mag je internet gebruiken.
- Bij internetinformatie: benoem kort dat het externe informatie is.
- Bij gaslucht, CO-risico, rookgaslekkage of acuut gevaar: eerst veiligstellen.

ANTWOORDFORMAT:
Gebruik altijd dit format:

Oorzaak:
- ...

Check:
- ...

Richtwaarde:
- ...

Actie:
- ...

Veiligheid:
- ...

STIJL:
- Kort
- Direct
- Technisch
- Werkvloer-taal
- Geen marketing
- Geen overbodige waarschuwingen

VOORBEELD:
Vraag: storing E36 Remeha Calenta

Antwoord:
Oorzaak:
- Rookgastraject / luchttoevoer probleem
- Mogelijk ventilator of drukverschilprobleem

Check:
- Rookgasafvoer en luchttoevoer op blokkade
- Condensafvoer / sifon
- Ventilator loopt aan en komt op toeren
- Stekkers en bedrading ventilator / pressostaat / sensor

Richtwaarde:
- Geen waarde noemen als die niet zeker is
- Vergelijk meetwaarden met toestelgegevens indien nodig

Actie:
- Rookgastraject vrijmaken
- Condensafvoer reinigen
- Ventilator controleren / vervangen indien defect
- Reset pas na herstel

Veiligheid:
- Bij rookgaslucht of CO-risico: toestel buiten bedrijf stellen
      `.trim(),

      input: `
Interne kennisbank:
${safeKnowledge || "Geen interne kennis beschikbaar."}

Vraag van monteur:
${question}
      `.trim(),
    });

    const answer =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "Geen antwoord ontvangen van de AI.";

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("AI fout:", error);

    return res.status(500).json({
      error: "AI fout",
      details: error?.message || String(error),
    });
  }
}
