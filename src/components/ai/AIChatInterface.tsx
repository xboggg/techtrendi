import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Send,
  X,
  Minus,
  Bot,
  User,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Trash2,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'like' | 'dislike';
}

interface SuggestedQuestion {
  text: string;
  icon: string;
}

const suggestedQuestions: SuggestedQuestion[] = [
  { text: 'Best smartphones 2025?', icon: '📱' },
  { text: 'How to stay safe online?', icon: '🔒' },
  { text: 'Compare iPhone vs Samsung', icon: '⚡' },
  { text: 'Best laptop for coding?', icon: '💻' },
  { text: 'AI tools for productivity?', icon: '🤖' },
  { text: 'How to start a tech career?', icon: '🚀' },
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_CHAT_API_KEY;

const SYSTEM_PROMPT = `You are TechTrendi AI, a friendly and knowledgeable tech assistant for the TechTrendi website (techtrendi.com). You help users with:
- Smartphone reviews, comparisons and buying advice
- Cybersecurity and online privacy tips
- AI and technology news and trends
- Productivity tools, apps and workflow tips
- Laptop, tablet and gadget recommendations
- Side hustle and tech career advice
- Gaming recommendations and PC builds
- Health tech and wearable devices

Keep responses concise (under 300 words), helpful, and conversational. Use bullet points and bold text for clarity. Format with markdown when helpful. When relevant, suggest checking out TechTrendi's tools, guides, or articles. Never make up specific product specs - be honest when unsure.`;

async function callGroqAI(message: string, history: Message[]): Promise<string> {
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Groq API error:', errText);
      throw new Error('API error');
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response. Please try again.";
  } catch (err) {
    console.error('Groq call failed:', err);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}

// Simple markdown-like rendering for bold and bullet points
function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    // Bold text
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <div key={i} className="flex gap-1.5 ml-1">
          <span className="text-primary shrink-0 mt-0.5">•</span>
          <span>{parts.slice(0).map((p, idx) => typeof p === 'string' ? p.replace(/^[-•]\s*/, '') : p)}</span>
        </div>
      );
    }

    return <p key={i} className={line.trim() === '' ? 'h-2' : ''}>{parts}</p>;
  });
}

export function AIChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Don't auto-focus on mobile to prevent keyboard from opening
  useEffect(() => {
    if (isOpen && !isMinimized && !isMobile) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, isMobile]);

  useEffect(() => {
    if (user && isOpen) {
      loadChatHistory();
    }
  }, [user, isOpen]);

  const loadChatHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (data && !error) {
        setMessages(
          data.map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }))
        );
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!user) return;
    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: sessionId,
        role,
        content,
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (user) saveMessage('user', userMessage.content);

    try {
      const response = await callGroqAI(userMessage.content, messages);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (user) saveMessage('assistant', assistantMessage.content);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg))
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard' });
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Compact floating chat button with galaxy orbiting stars
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Open AI Chat"
      >
        <div className="relative w-14 h-14 overflow-visible">
          {/* Ghostly emanation rings */}
          <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-[-4px] rounded-full bg-violet-400/15 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />

          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 blur-md animate-pulse-slow" />

          {/* Main button */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/40 group-hover:shadow-xl group-hover:shadow-purple-500/50 group-hover:scale-110 transition-all duration-300">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          {/* Orbiting star 1 */}
          <div className="absolute inset-[-6px] animate-spin" style={{ animationDuration: '6s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]" />
          </div>

          {/* Orbiting star 2 */}
          <div className="absolute inset-[-8px] animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}>
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_6px_2px_rgba(253,224,71,0.6)]" />
          </div>

          {/* Orbiting star 3 */}
          <div className="absolute inset-[-4px] animate-spin" style={{ animationDuration: '5s' }}>
            <div className="absolute top-1/2 right-0 w-1 h-1 rounded-full bg-pink-400 shadow-[0_0_6px_2px_rgba(244,114,182,0.6)]" />
          </div>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 px-3 py-1.5 rounded-lg bg-card border border-border shadow-lg text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Ask TechTrendi AI
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden',
        isMinimized
          ? 'bottom-6 right-6 w-72 h-12 rounded-2xl'
          : 'bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] md:w-[400px] h-[min(480px,70dvh)] md:h-[600px] md:max-h-[85vh] rounded-2xl'
      )}
    >
      {/* Header — gradient accent */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border/50 bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-fuchsia-600/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div>
            <span className="font-semibold text-sm">TechTrendi AI</span>
            <p className="text-[10px] text-muted-foreground leading-none">Powered by Groq</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {!isMinimized && messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleClearChat} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl">
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-xl">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center pt-8 pb-4">
                {/* Animated gradient icon */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/15 to-fuchsia-600/15 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 animate-pulse" />
                </div>
                <h4 className="font-bold text-lg mb-1">Hey! How can I help?</h4>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-[260px]">
                  Ask me anything about tech — gadgets, security, AI, careers & more
                </p>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(q.text);
                        if (!isMobile) inputRef.current?.focus();
                      }}
                      className="text-left p-3 rounded-xl bg-muted/40 hover:bg-muted border border-transparent hover:border-border/50 transition-all duration-200 text-xs group active:scale-[0.98]"
                    >
                      <span className="text-base">{q.icon}</span>
                      <p className="text-foreground/80 group-hover:text-foreground mt-1 leading-snug">{q.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-2.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2.5',
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-md shadow-sm'
                          : 'bg-muted/60 border border-border/30 rounded-bl-md'
                      )}
                    >
                      <div className="text-[13px] leading-relaxed space-y-1">
                        {renderContent(message.content)}
                      </div>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20">
                          <button
                            className={cn('p-1 rounded-md hover:bg-background/50 transition-colors', message.feedback === 'like' && 'text-green-500')}
                            onClick={() => handleFeedback(message.id, 'like')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button
                            className={cn('p-1 rounded-md hover:bg-background/50 transition-colors', message.feedback === 'dislike' && 'text-red-500')}
                            onClick={() => handleFeedback(message.id, 'dislike')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                          <button
                            className="p-1 rounded-md hover:bg-background/50 transition-colors"
                            onClick={() => handleCopy(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-primary/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-sm">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-muted/60 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input — enhanced */}
          <div className="px-3 py-3 border-t border-border/50 shrink-0 bg-gradient-to-t from-card to-transparent">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about tech..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 disabled:opacity-50 max-h-24 transition-all duration-200"
                style={{ minHeight: '40px' }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shrink-0 shadow-sm transition-all duration-200 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
              Powered by Groq AI · Responses may not always be accurate
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default AIChatInterface;
