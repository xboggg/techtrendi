# Feature Image Prompts — voice-ai-assistants-compared-which-understands-you-best

**Article:** "Voice AI Assistants Compared: Which One Actually Understands What You're Saying"
**Category:** AI Tech · 9 min read
**Current cover:** `https://images.pexels.com/photos/546819/...` — a generic code-editor stock photo,
the *same one* the inbox-zero article uses. Unrelated to voice AI, and duplicated across two articles.

**Target:** 1200x630px · **JPEG** (not WebP — see note) · **under 300KB**
**Upload via** /admin → the form writes `/images/articles/...` automatically.

⚠️ **After setting the image, tell me** — the OG cache (`/var/www/techtrendi/og-cache/`) holds the
old value for **24 hours**, so WhatsApp/Facebook previews will show the stale image until that one
cache entry is cleared. This is what broke the kidney article's preview for hours today.

---

## What the article actually argues

- Three weeks of hands-on testing: **Siri** (iOS 18.3), **Gemini Live** (Pixel 9 Pro),
  **Alexa** (Echo Show 10), **ChatGPT voice mode** (GPT-4o)
- Tested on: natural conversation, follow-ups, **accent handling**, noisy rooms, real tasks
- The thesis: everyone measures *transcription accuracy*, but that's solved. What separates
  them is **understanding intent** — "remind me about that meeting tomorrow morning" with no
  time given. Some freeze and ask; the good ones infer 9am and move on.

So the image should be about **being understood (or not)** — not a robot, not a soundwave cliché.

---

## OPTION 1 — The pause before it understands (RECOMMENDED)

Captures the article's actual subject: the gap between hearing and understanding.

```
Editorial photograph, close crop of a person mid-sentence speaking toward a
phone held in their hand, slight frown of concentration as if repeating
themselves. Warm indoor light from a window, softly blurred living room
behind. Shallow depth of field with the face sharp and the phone slightly
soft. Natural skin tones, no screen glow on the face. Documentary
photojournalism style, unposed, a real person rather than a model, mid-30s.
No visible phone UI, no brand logos, no text. 16:9 composition with clear
space on the left third for a headline overlay.
```

**Alt text:** `Person speaking to a phone with a look of concentration, repeating themselves`

---

## OPTION 2 — Four devices, one question

Illustrates the comparison directly. Best if you want the image to say "test" at a glance.

```
Editorial still life, overhead flat lay on a plain warm-grey surface: four
different consumer devices arranged in a row with even spacing — a
smartphone, a second smartphone, a small smart speaker with a screen, and a
tablet. All screens off and dark. Soft even daylight, gentle shadows falling
in the same direction. Minimal, clean, generous negative space around the
row. Muted neutral palette. Documentary product photography, no visible
branding, no logos, no text, no UI. 16:9.
```

**Alt text:** `Four voice assistant devices arranged in a row, screens off`

---

## OPTION 3 — Talking into the noise

Leans on the accent-and-noisy-room testing, which is the most relatable part for Ghanaian readers.

```
Editorial photograph of a person speaking into a phone at arm's length in a
busy everyday setting — a kitchen with someone moving in the background, or a
street-side with traffic softly blurred behind. Motion blur on the background,
subject sharp. Natural daylight, warm tones. The expression is patient,
slightly amused. Documentary photojournalism style, candid, real person not a
model. No readable text, no brand logos, no phone UI visible. 16:9.
```

**Alt text:** `Person speaking into a phone in a busy environment with movement behind them`

---

## RULES (learned the hard way today)

- **JPEG, not WebP.** WebP renders fine on WhatsApp (proven — `local-ai-models` uses it),
  but JPEG avoids the whole question and every known-good cover on the site is JPEG or WebP
  under ~150KB.
- **1200x630 exactly.** The site hardcodes `og:image:width=1200` / `og:image:height=630`
  site-wide in `SEOHead.tsx` and `OpenGraphCards.tsx`. A file with different real dimensions
  creates a declared-vs-actual mismatch.
- **Under 300KB**, checked as a real file size — not just an HTTP 200.
- **Don't reuse the Pexels code-editor photo.** Two articles already share it; a third would
  make the blog index look broken.
- Real people, real settings, no sterile studio stock, no glowing-robot AI clichés.
- Compress with Squoosh or TinyPNG before upload.
