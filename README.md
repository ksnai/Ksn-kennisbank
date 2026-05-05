# KSN AI Kennisbank - Vercel versie

Dit project bevat:
- `public/index.html` - de mobiele webapp
- `api/chat.js` - veilige backend route voor OpenAI
- `.env.example` - voorbeeld environment variables

## Installeren op Vercel

1. Maak een nieuw project op Vercel.
2. Upload/importeer deze map.
3. Ga naar Settings > Environment Variables.
4. Voeg toe:
   - `OPENAI_API_KEY` = jouw OpenAI API key
   - `OPENAI_MODEL` = bijvoorbeeld `gpt-4.1-mini`
5. Deploy opnieuw.
6. Open de Vercel-link.

## Belangrijk

Zet je API key nooit in `public/index.html`.
De API key hoort alleen in Vercel Environment Variables.
