# NEXORA AI

Premium AI directory + secure serverless AI chat starter for Netlify.

## Files
- `index.html` — responsive website, AI directory and chat interface
- `netlify/functions/chat.mjs` — server-side chat proxy (keeps API key out of browser)
- `netlify.toml` — Netlify publish and functions configuration
- `.env.example` — environment variable names (contains placeholders only)

## Important: configure AI chat
The directory works as a static website. The chat needs an API provider account and a valid API key. API usage may incur charges according to your provider's pricing.

In Netlify, open your site's environment variable settings and add:
- `OPENAI_API_KEY` — your secret API key
- `OPENAI_MODEL` — a chat model supported by your provider
- `OPENAI_BASE_URL` — optional; defaults to `https://api.openai.com/v1`

Do not put a real API key in `index.html`, browser JavaScript, or a public GitHub repository. After setting variables, trigger a new deploy so the function receives them.

## Deploy on Netlify
This project includes a Netlify Function, so deploy the whole project through a connected Git repository or Netlify CLI. A simple static drag-and-drop deployment does not package serverless functions.

### Git-based deployment
1. Create a GitHub repository and upload all files/folders in this project.
2. In Netlify, choose **Add new site / Import an existing project** and connect that repository.
3. Build settings: publish directory `.`; functions directory `netlify/functions`.
4. Deploy, then add the environment variables above and redeploy.

## Local preview
The website UI can be opened directly by opening `index.html`. The chat function will only work when served through Netlify Functions (or a compatible local Netlify development environment).
