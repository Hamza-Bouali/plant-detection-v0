### Environment variables

Create a file named `.env.local` in `plant-detection-v0/frontend/` with:

```env
# Backend image-classification API (your FastAPI/ngrok URL)
NEXT_PUBLIC_API_URL="https://tamie-windproof-lino.ngrok-free.dev"

# Gemini API key (server-side only; never expose as NEXT_PUBLIC_*)
# OpenAI API key (server-side only; never expose as NEXT_PUBLIC_*)
OPENAI_API_KEY="YOUR_OPENAI_KEY_HERE"

# Optional: override the model (default is gpt-4o-mini)
OPENAI_MODEL="gpt-4o-mini"
```

Notes:
- `OPENAI_API_KEY` is only used by the Next.js server route `app/api/recommendations/route.ts`.
- If `OPENAI_API_KEY` is missing, the app will automatically fall back to the local knowledge base (no OpenAI call).


