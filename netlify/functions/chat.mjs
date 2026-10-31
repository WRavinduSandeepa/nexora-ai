// Netlify serverless function: keeps the provider API key on the server.
export default async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405, headers: { "Content-Type": "application/json", "Allow": "POST" }
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");

  if (!apiKey || !model) {
    return new Response(JSON.stringify({
      error: "AI chat is not configured yet. The site owner needs to add the server environment variables."
    }), { status: 503, headers: { "Content-Type": "application/json" } });
  }

  let body;
  try { body = await request.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const messages = incoming
    .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return new Response(JSON.stringify({ error: "Please send a message first." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
  if (totalChars > 16000) {
    return new Response(JSON.stringify({ error: "This conversation is too long. Start a new message." }), {
      status: 413, headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are NEXORA AI, a helpful, clear and respectful assistant. Give concise, useful answers. If the user writes in Sinhala, respond in Sinhala." },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 900
      })
    });

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("AI provider error:", upstream.status, result?.error?.message || "Unknown provider error");
      return new Response(JSON.stringify({
        error: upstream.status === 401
          ? "The AI provider rejected the API key. Please check the key in Netlify environment variables."
          : "The AI provider could not complete the request. Please check the model, API settings and account limits."
      }), { status: 502, headers: { "Content-Type": "application/json" } });
    }

    const reply = result?.choices?.[0]?.message?.content;
    const text = typeof reply === "string"
      ? reply
      : Array.isArray(reply) ? reply.map(part => part?.text || "").join("\n") : "";

    if (!text.trim()) throw new Error("Empty AI response");
    return new Response(JSON.stringify({ reply: text }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: "The AI service is temporarily unavailable. Please try again later." }), {
      status: 502, headers: { "Content-Type": "application/json" }
    });
  }
};
