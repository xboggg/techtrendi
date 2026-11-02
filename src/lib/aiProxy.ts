// The AI tools and the AI chat call the AI through our own server, never directly:
// nginx on the web server answers /api/ai/tools and /api/ai/chat, adds the Groq key
// there (root-only file), and limits each visitor's request rate. The key is never
// in the public JS. Set up 2026-11-02 — see server-ops srv144/nginx/techtrendi.com.
export const AI_TOOLS_URL = "/api/ai/tools";
export const AI_CHAT_URL = "/api/ai/chat";

// Groq retired llama-3.3-70b-versatile for our key ("model_not_found", Nov 2026).
// Change the model here only — every AI tool and the chat use this one value.
export const AI_MODEL = "openai/gpt-oss-120b";

// gpt-oss "thinks" before answering, and that thinking counts toward each tool's
// max_tokens. At the default effort it used the whole budget (Business Name
// Generator: 3/3 cut off; YouTube titles: empty). "low" leaves room for the answer
// (3/3 complete, ~1,190 of 1,500 tokens). Sent with every request.
export const AI_REASONING_EFFORT = "low";
