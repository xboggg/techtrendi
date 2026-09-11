# Feature Image Prompts — email-management-strategies-inbox-zero

**Article:** "Inbox Zero Is Real — But Probably Not How You're Doing It" · Category: Productivity · 9 min read
**Current image:** a code-editor screenshot (Pexels) — unrelated to email, which is why it needs replacing.

**Target:** 1200x630px · WebP · **must be under 300KB** (WhatsApp link previews break above this)
**Save to:** `public/images/articles/` (or upload via /admin — it writes the path automatically)
**Note:** after setting the image, the site must be REBUILT before WhatsApp/Facebook previews change —
`og:image` is baked into the prerendered HTML at build time, not read live from the database.

---

## What the article is actually about

Worth knowing before picking an image — the piece argues against the usual inbox-zero cliché:

- Opens with **14,000 unread emails** and losing a contract renewal in the pile
- **Merlin Mann coined the term in 2006** — and meant something different from what people think
- The real point: your inbox is a **processing space, not a storage space**. "Zero" refers to the
  time your brain spends worrying about what's in there, not the number on the badge
- Cites a 2023 McKinsey Global Institute report on knowledge-worker email time

So the strongest image is about **relief and control**, not a screenshot of a tidy mailbox.

---

## OPTION 1 — The overwhelming number (RECOMMENDED)

Matches the article's opening hook, which is its most memorable moment.

```
Editorial photograph, over-the-shoulder view of a person at a cluttered desk
looking at a laptop screen showing an enormous unread email count. The room is
dim, lit mainly by the screen, early morning light coming through a window
behind. Their posture reads as tired resignation, one hand on the back of the
neck. Shallow depth of field, screen glow on the face. Muted cool tones with a
warm window highlight. Documentary photojournalism style, unposed, real person
not a model. No readable text on screen, no brand logos, no recognisable email
client UI. 16:9 composition with space on the left for a headline overlay.
```

**Alt text:** `Person at a dim desk facing a laptop showing thousands of unread emails`

---

## OPTION 2 — Processing, not storing

Illustrates the actual thesis rather than the problem. Better if you want the image to teach.

```
Editorial still life, overhead view of a clean wooden desk with a single sheet
of paper being moved from a full inbox tray into a sorted file, hands in frame.
One tray overflowing, one tray empty. Warm natural side light, soft shadows.
Minimal, calm, lots of negative space. Muted neutral palette with one accent
colour. Documentary product photography, no text, no logos. 16:9.
```

**Alt text:** `Hands moving paper from a full inbox tray into a sorted file`

---

## OPTION 3 — The empty inbox as calm

Simplest and most aspirational. Weakest thesis match, strongest visual appeal.

```
Editorial photograph of a person leaning back from a desk with a relaxed
expression, laptop closed in front of them, morning coffee beside it, soft
daylight from a window. The desk is uncluttered. Genuine relief on the face,
not a stock-photo smile. Shallow depth of field, warm natural tones.
Documentary style, real person, unposed. No text, no logos. 16:9 composition.
```

**Alt text:** `Person leaning back from an uncluttered desk with a closed laptop`

---

## RULES

- **Under 300KB.** Check the real file size before calling it done — do not trust an HTTP 200.
- WebP format, 1200x630 preferred (the site declares `og:image:height` as 630 site-wide).
- No readable email client UI — avoids dating the image and avoids trademark issues.
- Real-looking people in real settings, not sterile studio stock.
- Compress with Squoosh or TinyPNG before uploading.
- **Rebuild after setting the image**, or the WhatsApp preview will not change.
