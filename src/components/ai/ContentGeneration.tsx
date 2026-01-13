import { useState } from 'react';
import {
  Wand2,
  FileText,
  List,
  MessageSquare,
  Copy,
  RefreshCw,
  Check,
  Sparkles,
  BookOpen,
  Lightbulb,
  PenTool,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ContentType = 'article' | 'summary' | 'headline' | 'outline' | 'social' | 'seo';
type ToneType = 'professional' | 'casual' | 'technical' | 'friendly' | 'persuasive';

interface GenerationOptions {
  contentType: ContentType;
  tone: ToneType;
  length: 'short' | 'medium' | 'long';
  keywords: string[];
}

// Content generation templates (simulated - in production, use AI API)
const generateContent = async (
  topic: string,
  options: GenerationOptions
): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  const { contentType, tone, length } = options;

  // Simulated AI responses based on type
  switch (contentType) {
    case 'article':
      if (length === 'short') {
        return `# ${topic}

${topic} has become increasingly important in today's tech landscape. Here's what you need to know.

## Key Points

Modern ${topic.toLowerCase()} solutions offer improved performance, better security, and enhanced user experience. Whether you're a casual user or a tech enthusiast, understanding these developments can help you make informed decisions.

## What This Means for You

The advancements in ${topic.toLowerCase()} technology directly impact how we interact with our devices daily. From faster processing to smarter automation, these improvements are designed to make technology work better for everyone.

**Bottom Line:** Stay informed about ${topic.toLowerCase()} developments to get the most out of your tech investments.`;
      }
      return `# ${topic}: A Comprehensive Guide

## Introduction

In the rapidly evolving world of technology, ${topic.toLowerCase()} has emerged as a crucial topic for both consumers and professionals alike. This comprehensive guide will walk you through everything you need to know.

## Understanding ${topic}

At its core, ${topic.toLowerCase()} represents a significant shift in how we approach technology. The key aspects include:

1. **Enhanced Performance** - Modern solutions offer up to 40% improvement in speed and efficiency
2. **Better Security** - Advanced protection features keep your data safe
3. **Improved User Experience** - Intuitive interfaces make technology more accessible
4. **Future-Proof Design** - Built to adapt to tomorrow's challenges

## Why It Matters

The importance of ${topic.toLowerCase()} cannot be overstated. As we increasingly rely on technology in our daily lives, understanding these developments helps us:

- Make informed purchasing decisions
- Maximize the value of our existing devices
- Stay ahead of potential security threats
- Take advantage of new features and capabilities

## Expert Recommendations

Based on our extensive testing and research, we recommend:

1. **Stay Updated** - Regular updates ensure you have the latest improvements
2. **Compare Options** - Don't settle for the first solution you find
3. **Consider Long-term Value** - Sometimes paying more upfront saves money later
4. **Read Reviews** - Learn from others' experiences before committing

## Conclusion

${topic} continues to evolve, bringing new opportunities and challenges. By staying informed and making thoughtful decisions, you can ensure you're getting the best possible experience from your technology.

*Have questions about ${topic.toLowerCase()}? Leave a comment below or check out our related guides.*`;

    case 'summary':
      return `**Quick Summary: ${topic}**

${topic} is reshaping the tech industry with innovations in performance, security, and user experience. Key takeaways:

• Significant improvements in speed and efficiency
• Enhanced security features for better data protection
• More intuitive and user-friendly interfaces
• Growing importance for both consumers and businesses

This technology is worth watching as it continues to mature and become more accessible.`;

    case 'headline':
      const headlines = [
        `${topic}: Everything You Need to Know in 2024`,
        `The Ultimate Guide to ${topic} for Tech Enthusiasts`,
        `${topic} Explained: Why It Matters for Your Digital Life`,
        `Breaking Down ${topic}: Expert Insights and Recommendations`,
        `${topic} Revolution: How This Technology Is Changing Everything`,
        `Inside ${topic}: A Deep Dive Into the Future of Tech`,
        `${topic} 101: From Basics to Advanced Strategies`,
        `Why ${topic} Should Be on Your Radar This Year`,
      ];
      return headlines.join('\n');

    case 'outline':
      return `# Article Outline: ${topic}

## I. Introduction
   A. Hook: Engaging opening about ${topic.toLowerCase()}
   B. Thesis: Why readers should care
   C. Overview of what will be covered

## II. Background
   A. History and evolution
   B. Current state of the technology
   C. Key players and stakeholders

## III. Core Concepts
   A. Fundamental principles
   B. Technical specifications
   C. How it works in practice

## IV. Benefits and Advantages
   A. Performance improvements
   B. Security enhancements
   C. User experience gains
   D. Cost considerations

## V. Challenges and Limitations
   A. Current drawbacks
   B. Areas for improvement
   C. Common misconceptions

## VI. Practical Applications
   A. Real-world use cases
   B. Industry-specific implementations
   C. Consumer applications

## VII. Expert Insights
   A. Industry opinions
   B. Future predictions
   C. Recommended best practices

## VIII. Conclusion
   A. Summary of key points
   B. Call to action
   C. Future outlook

## IX. Additional Resources
   A. Related articles
   B. Tools and downloads
   C. Further reading`;

    case 'social':
      return `**Twitter/X:**
🚀 ${topic} is changing the game! Here's what you need to know about this revolutionary tech trend. Thread 🧵👇

**LinkedIn:**
I've been researching ${topic} and the implications for our industry are significant. In this post, I'll share key insights that every professional should know about this emerging technology.

**Instagram Caption:**
${topic} is here and it's incredible! 🔥 Swipe to learn why this matters for your tech life ➡️

#Technology #Innovation #TechTrends #${topic.replace(/\s+/g, '')}

**Facebook:**
Have you heard about ${topic}? 🤔 It's one of the most exciting developments in tech right now. Here's a quick breakdown of what it is and why it matters for you...

**YouTube Description:**
In today's video, we're diving deep into ${topic}! We'll cover everything from the basics to advanced tips, plus our honest thoughts on whether it's worth your attention. Don't forget to like and subscribe!`;

    case 'seo':
      return `**SEO Meta Description (160 chars):**
Discover everything about ${topic}. Our comprehensive guide covers key features, benefits, and expert tips. Learn why ${topic.toLowerCase()} matters for you.

**SEO Title Tag (60 chars):**
${topic} Guide 2024: Features, Benefits & Expert Tips

**Primary Keywords:**
- ${topic.toLowerCase()}
- ${topic.toLowerCase()} guide
- ${topic.toLowerCase()} review
- best ${topic.toLowerCase()}
- ${topic.toLowerCase()} explained

**Long-tail Keywords:**
- what is ${topic.toLowerCase()}
- how does ${topic.toLowerCase()} work
- ${topic.toLowerCase()} vs alternatives
- ${topic.toLowerCase()} for beginners
- is ${topic.toLowerCase()} worth it

**H1 Suggestion:**
${topic}: The Complete Guide for 2024

**Image Alt Tags:**
- "${topic} overview infographic"
- "${topic} comparison chart"
- "${topic} features diagram"

**Internal Linking Opportunities:**
- Link to related product reviews
- Link to comparison articles
- Link to buying guides
- Link to glossary terms`;

    default:
      return `Generated content for: ${topic}`;
  }
};

// Content Generation Widget
export function ContentGenerationWidget({ className }: { className?: string }) {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<GenerationOptions>({
    contentType: 'article',
    tone: 'professional',
    length: 'medium',
    keywords: [],
  });
  const [keywordInput, setKeywordInput] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic to generate content.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const content = await generateContent(topic, options);
      setGeneratedContent(content);
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'An error occurred while generating content.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !options.keywords.includes(keywordInput.trim())) {
      setOptions({
        ...options,
        keywords: [...options.keywords, keywordInput.trim()],
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setOptions({
      ...options,
      keywords: options.keywords.filter((k) => k !== keyword),
    });
  };

  const contentTypeIcons: Record<ContentType, typeof FileText> = {
    article: FileText,
    summary: List,
    headline: Lightbulb,
    outline: BookOpen,
    social: MessageSquare,
    seo: Zap,
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl', className)}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <PenTool className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">AI Content Generator</h3>
            <p className="text-xs text-muted-foreground">Create tech content instantly</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Topic Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Topic</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., iPhone 15 Pro, AI in Healthcare, Best VPN Services..."
            className="w-full"
          />
        </div>

        {/* Content Type Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Content Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(contentTypeIcons) as ContentType[]).map((type) => {
              const Icon = contentTypeIcons[type];
              return (
                <button
                  key={type}
                  onClick={() => setOptions({ ...options, contentType: type })}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                    options.contentType === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs capitalize">{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tone and Length */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tone</label>
            <Select
              value={options.tone}
              onValueChange={(value: ToneType) =>
                setOptions({ ...options, tone: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Length</label>
            <Select
              value={options.length}
              onValueChange={(value: 'short' | 'medium' | 'long') =>
                setOptions({ ...options, length: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="text-sm font-medium mb-2 block">Keywords (Optional)</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Add keyword..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button variant="outline" size="icon" onClick={addKeyword}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
          {options.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {options.keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="gap-1">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="hover:text-destructive">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>

        {/* Generated Content */}
        {generatedContent && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Generated Content</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Content Actions
export function QuickContentActions({
  content,
  onUpdate,
  className,
}: {
  content: string;
  onUpdate: (newContent: string) => void;
  className?: string;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const improveContent = async (action: string) => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let improved = content;

    switch (action) {
      case 'expand':
        improved = content + '\n\n[Expanded content with additional details and examples would appear here...]';
        break;
      case 'shorten':
        improved = content.split('.').slice(0, 3).join('.') + '.';
        break;
      case 'formalize':
        improved = content.replace(/!/g, '.').replace(/\.\.\./g, '.');
        break;
      case 'simplify':
        improved = content; // In production, use AI to simplify
        break;
    }

    onUpdate(improved);
    setIsProcessing(false);
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => improveContent('expand')}
        disabled={isProcessing}
      >
        <Wand2 className="w-3 h-3 mr-1" />
        Expand
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => improveContent('shorten')}
        disabled={isProcessing}
      >
        <List className="w-3 h-3 mr-1" />
        Shorten
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => improveContent('formalize')}
        disabled={isProcessing}
      >
        <FileText className="w-3 h-3 mr-1" />
        Formalize
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => improveContent('simplify')}
        disabled={isProcessing}
      >
        <Lightbulb className="w-3 h-3 mr-1" />
        Simplify
      </Button>
    </div>
  );
}

export default ContentGenerationWidget;
