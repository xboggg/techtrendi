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

const toolPrompts: Record<string, string> = {
  'blog-outline': `You are a blog outline expert. Given a topic, blog type, audience level, target word count, and optional keywords, generate a detailed, topic-specific blog outline.

Return ONLY valid JSON with no markdown. The JSON must be:
{
  "sections": [
    {
      "heading": "Section title specific to the topic",
      "subpoints": ["Specific subpoint 1", "Specific subpoint 2", "Specific subpoint 3"]
    }
  ]
}

Rules:
- Generate 5-8 sections depending on word count target
- Every heading and subpoint must be SPECIFIC to the topic (no generic placeholders like "[Item]")
- Include keywords naturally in headings where relevant
- Adapt structure to the blog type (how-to, listicle, comparison, etc.)
- Adjust depth/complexity for the audience level`,

  'business-name': `You are a creative business naming expert. Given a business industry, style preferences, and optional keywords, generate unique business name suggestions.

Return ONLY valid JSON:
{
  "names": [
    {
      "name": "The business name",
      "tagline": "A short catchy tagline",
      "reasoning": "Brief explanation of why this name works"
    }
  ]
}

Rules:
- Generate exactly 10 unique name suggestions
- Mix different naming styles: compound words, portmanteaus, invented words, descriptive names
- Names should be memorable, easy to spell, and brandable
- Include a mix of serious and creative options
- Each name should feel like a real brand`,

  'product-description': `You are an expert product copywriter. Given a product name, category, key features, target audience, and desired tone, write a compelling product description.

Return ONLY valid JSON:
{
  "description": "The full product description with line breaks",
  "headline": "A catchy one-line headline",
  "bulletPoints": ["Key selling point 1", "Key selling point 2", "Key selling point 3", "Key selling point 4"]
}

Rules:
- Match the requested tone exactly (professional, casual, luxury, playful, minimalist)
- Description should be 100-200 words
- Include emotional triggers and benefits, not just features
- Make it conversion-focused with a subtle call to action
- Bullet points should highlight key benefits`,

  'social-caption': `You are a social media content expert. Given a product/topic name, platform, tone, and optional details, generate engaging social media captions.

Return ONLY valid JSON:
{
  "captions": [
    "First caption option",
    "Second caption option",
    "Third caption option"
  ]
}

Rules:
- Generate exactly 3 caption variations
- Each caption must be platform-appropriate:
  - Twitter: under 280 chars, punchy, with 1-2 relevant hashtags
  - Instagram: engaging, with emojis, line breaks, and 5-10 hashtags at the end
  - LinkedIn: professional tone, thought-provoking, 2-3 hashtags
  - Facebook: conversational, question-based engagement, 1-2 hashtags
  - TikTok: trendy, fun, with relevant hashtags and emoji
- Match the requested tone (professional, casual, humorous, inspirational, educational)
- Include a call to action in at least one caption`,

  'meeting-notes': `You are a meeting notes analyst. Given raw meeting notes, extract and organize the key information.

Return ONLY valid JSON:
{
  "summary": "A concise 2-3 sentence summary of the meeting",
  "keyDecisions": ["Decision 1", "Decision 2"],
  "actionItems": [
    {"task": "What needs to be done", "owner": "Person responsible (if mentioned)", "deadline": "When (if mentioned)"}
  ],
  "topics": ["Main topic 1", "Main topic 2"],
  "followUps": ["Follow-up item 1", "Follow-up item 2"]
}

Rules:
- Extract real information from the notes, don't fabricate
- If owners or deadlines aren't mentioned, use "TBD"
- Keep the summary concise and actionable
- Identify all action items even if not explicitly labeled as such`,

  'cold-email': `You are an expert cold email copywriter. Given the purpose, sender info, recipient info, and context, write a compelling cold email that gets responses.

Return ONLY valid JSON:
{
  "subject": "The email subject line",
  "body": "The full email body with line breaks"
}

Rules:
- Keep subject lines under 60 characters, curiosity-driven
- Email body should be concise (under 150 words)
- Personalize based on the provided context
- Include a clear, low-friction call to action
- No generic placeholders like [Your Name] - use the actual provided names
- Match the tone to the purpose (sales=persuasive, networking=warm, job=professional)
- Use line breaks for readability`,

  'cover-letter': `You are a professional cover letter writer. Given job details, candidate info, skills, and experience, write a compelling cover letter.

Return ONLY valid JSON:
{
  "coverLetter": "The full cover letter text with line breaks"
}

Rules:
- Professional but not stiff - show personality
- Open with a strong hook, not "I am writing to apply for..."
- Highlight relevant skills and achievements with specific examples
- Show knowledge of the company/role
- Close with confidence and a clear call to action
- Keep it to 3-4 paragraphs, under 400 words
- Use the actual names/details provided, no placeholders`,

  'proposal': `You are a business proposal expert. Given project details, client info, scope, timeline, and budget, write a professional proposal.

Return ONLY valid JSON:
{
  "proposal": "The full proposal text with line breaks and sections"
}

Rules:
- Include sections: Executive Summary, Project Scope, Approach, Timeline, Investment, Next Steps
- Be specific to the project details provided
- Use professional language but keep it readable
- Include value propositions and benefits
- Make the pricing/investment section clear
- End with a compelling call to action
- No generic placeholders - use actual details provided`,

  'username': `You are a creative username generator. Given a name, interests, style preference, and optional keywords, generate unique username suggestions.

Return ONLY valid JSON:
{
  "usernames": [
    {
      "username": "the_username",
      "style": "style category (e.g. professional, creative, gaming, etc.)"
    }
  ]
}

Rules:
- Generate exactly 15 unique usernames
- Mix styles: professional, creative, gaming, aesthetic, minimalist
- Keep them memorable and easy to type
- Some should incorporate the person's name creatively
- Some should be based on their interests
- Include variations with numbers, underscores, dots
- All should be realistic social media usernames (3-20 chars)`,

  'startup-validator': `You are a startup advisor and business analyst. Given a startup idea with problem statement, solution, target market, and business model, provide detailed validation feedback.

Return ONLY valid JSON:
{
  "overallScore": 75,
  "problemScore": 80,
  "solutionScore": 70,
  "marketScore": 75,
  "feasibilityScore": 70,
  "feedback": {
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2", "Actionable suggestion 3"],
    "marketInsights": "Brief market analysis paragraph",
    "nextSteps": ["Next step 1", "Next step 2", "Next step 3"]
  }
}

Rules:
- Scores should be realistic (0-100), not inflated
- Be honest but constructive in feedback
- Provide specific, actionable suggestions
- Market insights should reference real trends when possible
- Next steps should be concrete and prioritized`,

  'brand-audit': `You are a personal branding expert. Given information about someone's online presence, industry, goals, and current brand elements, provide a detailed brand audit.

Return ONLY valid JSON:
{
  "overallScore": 72,
  "scores": {
    "consistency": 70,
    "visibility": 65,
    "messaging": 75,
    "engagement": 68,
    "professionalism": 80
  },
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"],
  "quickWins": ["Quick win 1", "Quick win 2", "Quick win 3"],
  "strategy": "A brief 2-3 sentence personalized branding strategy recommendation"
}

Rules:
- Be specific to their industry and goals
- Scores should be realistic, not inflated
- Quick wins should be actionable within 1 week
- Improvements should be prioritized by impact
- Strategy should be personalized and actionable`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const { tool, input } = await req.json();

    if (!tool || !toolPrompts[tool]) {
      throw new Error(`Unknown tool: ${tool}. Available: ${Object.keys(toolPrompts).join(', ')}`);
    }

    if (!input) {
      throw new Error('Input is required');
    }

    const systemPrompt = toolPrompts[tool];
    const userPrompt = typeof input === 'string' ? input : JSON.stringify(input);

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
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', errorData);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    const result = JSON.parse(generatedText);

    return new Response(
      JSON.stringify(result),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI generate error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
