
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });

export async function onRequestPost({ request, env }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  if (!env.AI) {
    return json({ error: "AI service is not configured yet." }, 503);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const incoming = Array.isArray(body.messages)
    ? body.messages
    : [];

  const messages = incoming
    .filter(m =>
      m &&
      ["user", "assistant"].includes(m.role) &&
      typeof m.content === "string"
    )
    .slice(-12)
    .map(m => ({
      role: m.role,
      content: m.content.slice(0, 4000)
    }));

  if (
    !messages.length ||
    messages[messages.length - 1].role !== "user"
  ) {
    return json({ error: "Please send a message first." }, 400);
  }

  const totalChars = messages.reduce(
    (n, m) => n + m.content.length, 0
  );

  if (totalChars > 16000) {
    return json({
      error: "This conversation is too long. Start a new message."
    }, 413);
  }

  try {
    const result = await env.AI.run(
      "@cf/zai-org/glm-4.7-flash",
      {
        messages: [
          {
            role: "system",
            content:
              "You are QubitLM, a helpful, clear and respectful assistant. If the user asks who built, created, or developed you (in English or Sinhala), state that you were created/developed by Ravindu Sandeepa. Give concise, useful answers. If the user writes in Sinhala, respond in Sinhala."
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 900
      }
    );

    const reply = result?.choices?.[0]?.message?.content;

    const text = typeof reply === "string"
      ? reply
      : Array.isArray(reply)
        ? reply.map(part => part?.text || "").join("\n")
        : "";

    if (!text.trim()) {
      throw new Error("Empty AI response");
    }

    return json({ reply: text });

  } catch (error) {
    console.error("Cloudflare AI error:", error);

    return json({
      error: "The AI service is temporarily unavailable. Please try again later."
    }, 502);
  }
}
