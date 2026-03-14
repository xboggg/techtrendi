#!/usr/bin/env python3
"""
Lightweight API for generating short card content (Creepy Tech / Cyber Awareness).
Runs on VPS port 5114. Proxied via nginx at /api/generate-card.
"""

import os
import json
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
import anthropic

# Read env
env_vars = {}
for env_path in ["/opt/tech-news/.env", "/opt/supabase/docker/.env"]:
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()

ANTHROPIC_API_KEY = env_vars.get("ANTHROPIC_API_KEY", "")
AUTH_TOKEN = env_vars.get("SERVICE_ROLE_KEY", env_vars.get("SUPABASE_SERVICE_ROLE_KEY", ""))

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_POST(self):
        if self.path != "/generate-card":
            self.send_response(404)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
            return

        # Auth
        auth = self.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
        if not AUTH_TOKEN or token != AUTH_TOKEN:
            self.send_response(401)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Unauthorized"}).encode())
            return

        # Read body
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length > 0 else {}

        title = body.get("title", "").strip()
        category = body.get("category", "").strip()
        card_type = body.get("type", "creepy_tech")

        if not title:
            self.send_response(400)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "title is required"}).encode())
            return

        try:
            if card_type == "cyber_awareness":
                prompt = f"""Write a short, viral social media card post about this cybersecurity awareness topic for NON-TECHNICAL people: "{title}" (Category: {category}).

Requirements:
- 150-200 words maximum
- Start with a relatable scenario or shocking hook
- Explain the danger in simple terms anyone can understand
- Use arrows (→) for actionable defense steps
- End with a memorable one-liner
- No jargon, no acronyms without explanation
- Tone: like a smart friend warning you over coffee
- Format: plain text with line breaks, no markdown headers, no hashtags"""
            else:
                prompt = f"""Write a short, viral social media card post about this creepy tech topic: "{title}" (Category: {category}).

Requirements:
- 150-200 words maximum
- Start with a shocking hook line
- Include 2-3 specific facts or details
- Use arrows (→) for action items
- End with a punchy one-liner that makes people want to screenshot and share
- No hashtags, no "follow for more", no fluff
- Tone: alarming but factual, like a friend warning you
- Format: plain text with line breaks, no markdown headers"""

            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text.strip()

            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"content": content}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def log_message(self, fmt, *args):
        print(f"[CardAPI] {args[0]}", flush=True)


def main():
    port = 5114
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"Card API running on port {port}", flush=True)
    server.serve_forever()

if __name__ == "__main__":
    main()
