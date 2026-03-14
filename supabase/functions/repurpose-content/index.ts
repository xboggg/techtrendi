import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ALLOWED_ORIGINS = [
  'https://techtrendi.com',
  'https://www.techtrendi.com',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

interface RepurposeRequest {
  content: string;
  formats: string[];
}

const systemPrompt = `You are a content repurposing expert. Given a piece of content (blog post, article, etc.), transform it into the requested social media formats.

IMPORTANT: Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text. Just the raw JSON object.

The JSON object should have these keys based on requested formats:
- "tweets": array of 3 tweet strings (each under 280 chars, engaging, with relevant emojis)
- "linkedin": a professional LinkedIn post (with hashtags, line breaks for readability)
- "emailNewsletter": an email newsletter format (with subject line, greeting, body, CTA, sign-off)
- "instagramCaption": an Instagram caption (with emojis, call to action, and relevant hashtags)
- "summary": a concise TL;DR summary (1-2 sentences)

Make the content engaging, platform-appropriate, and preserve the key message of the original content. Do NOT use placeholder text - generate real, usable content based on the input.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const { content, formats }: RepurposeRequest = await req.json();

    if (!content || content.trim().length === 0) {
      throw new Error('Content is required');
    }

    const requestedFormats = formats?.length > 0
      ? formats
      : ['tweets', 'linkedin', 'emailNewsletter', 'instagramCaption', 'summary'];

    const userPrompt = `Repurpose the following content into these formats: ${requestedFormats.join(', ')}

Original content:
"""
${content.substring(0, 4000)}
"""

Return ONLY the JSON object with the requested format keys. No markdown, no code blocks.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', errorData);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    const generatedContent = JSON.parse(generatedText);

    // Ensure all expected keys exist with fallbacks
    const result = {
      tweets: generatedContent.tweets || [],
      linkedin: generatedContent.linkedin || '',
      emailNewsletter: generatedContent.emailNewsletter || '',
      instagramCaption: generatedContent.instagramCaption || '',
      summary: generatedContent.summary || '',
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error repurposing content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
