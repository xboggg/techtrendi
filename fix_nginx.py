#!/usr/bin/env python3
"""Fix the nginx config to add generate-card location block properly."""

path = "/etc/nginx/sites-enabled/db.techtrendi.com"

with open(path) as f:
    content = f.read()

# Remove the broken generate-card block (single line with empty headers)
import re
# Remove the broken block
content = re.sub(
    r'    location /api/generate-card \{[^\n]*\}\n?',
    '',
    content
)

# Now add a proper multi-line block before generate-article
new_block = """    location /api/generate-card {
        proxy_pass http://127.0.0.1:5114/generate-card;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        client_max_body_size 1M;
    }

"""

# Insert before the generate-article location
content = content.replace(
    "location /api/generate-article",
    new_block + "location /api/generate-article",
    1
)

with open(path, "w") as f:
    f.write(content)

print("Fixed!")
