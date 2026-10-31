
export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed." }),
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    const lastMessage = messages
      .filter(m => m && m.role === "user")
      .at(-1);

    if (!lastMessage || typeof lastMessage.content !== "string") {
      return new Response(
        JSON.stringify({ error: "Please send a message first." }),
        { status: 400 }
      );
    }

    const question = lastMessage.content.toLowerCase().trim();

    let reply;

    if (/^(hi|hello|hey|ආයුබෝවන්|හායි)/i.test(question)) {
      reply = "Hello! Welcome to NEXORA AI Demo. How can I help you today?";
    }
    else if (
      question.includes("who created") ||
      question.includes("who built") ||
      question.includes("කවුද හැදුවේ")
    ) {
      reply = "NEXORA AI was created by Ravindu Sandeepa.";
    }
    else if (
      question.includes("what is nexora") ||
      question.includes("nexora ai")
    ) {
      reply = "NEXORA AI is an AI model directory and chat demo project.";
    }
    else if (
      question.includes("help") ||
      question.includes("උදව්")
    ) {
      reply = "I can answer a few demo questions about NEXORA AI. Try asking who created NEXORA AI.";
    }
    else {
      reply = "Thanks for your question! This is NEXORA AI Demo Mode. I don't have a real AI model connected yet, so I can only answer a limited set of predefined questions.";
    }

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Unable to process your message." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
