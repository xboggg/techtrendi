import { useState, useRef, useEffect } from 'react';
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
  { text: 'Best smartphones 2024?', icon: '📱' },
  { text: 'How to stay safe online?', icon: '🔒' },
  { text: 'Compare iPhone vs Samsung', icon: '⚡' },
  { text: 'Best laptop for coding?', icon: '💻' },
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_CHAT_API_KEY;

const SYSTEM_PROMPT = `You are TechTrendi AI, a friendly and knowledgeable tech assistant for the TechTrendi website (techtrendi.com). You help users with:
- Smartphone reviews, comparisons and buying advice
- Cybersecurity and online privacy tips
- AI and technology news
- Productivity tools and tips
- Laptop and gadget recommendations
- Side hustle and tech career advice

Keep responses concise (under 200 words), helpful, and conversational. Use bullet points and bold text for clarity. When relevant, suggest checking out TechTrendi's tools, guides, or articles. Never make up specific product specs - be honest when unsure.`;

async function callGroqAI(message: string, history: Message[]): Promise<string> {
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.slice(-6).map((m) => ({
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
        max_tokens: 512,
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

export function AIChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

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
          <div className="absolute inset-[-8px] rounded-full bg-fuchsia-400/10 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />

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

          {/* Orbiting star 4 */}
          <div className="absolute inset-[-10px] animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}>
            <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
          </div>

          {/* Tiny twinkling stars */}
          <div className="absolute inset-[-6px] animate-spin" style={{ animationDuration: '12s' }}>
            <div className="absolute bottom-1 left-0 w-1 h-1 rounded-full bg-white/80 animate-pulse" />
          </div>
          <div className="absolute inset-[-5px] animate-spin" style={{ animationDuration: '7s', animationDirection: 'reverse' }}>
            <div className="absolute top-0 right-1 w-0.5 h-0.5 rounded-full bg-violet-300 animate-pulse" style={{ animationDelay: '1s' }} />
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
        'fixed bottom-6 right-6 z-50 flex flex-col bg-card border border-border rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden',
        isMinimized ? 'w-72 h-12' : 'w-[360px] h-[520px] max-h-[80vh]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm">TechTrendi AI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        </div>
        <div className="flex items-center gap-0.5">
          {!isMinimized && messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleClearChat} className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 px-3 py-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center pt-6 pb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-violet-500/15 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1">How can I help?</h4>
                <p className="text-xs text-muted-foreground mb-4 text-center">
                  Tech advice, comparisons, security tips & more
                </p>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(q.text); inputRef.current?.focus(); }}
                      className="text-left p-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-all text-xs group"
                    >
                      <span className="text-sm">{q.icon}</span>
                      <p className="text-foreground/80 group-hover:text-foreground mt-0.5 leading-snug">{q.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-2',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-xl px-3 py-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      )}
                    >
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-0.5 mt-1.5 pt-1.5 border-t border-border/30">
                          <button
                            className={cn('p-1 rounded hover:bg-background/50 transition-colors', message.feedback === 'like' && 'text-green-500')}
                            onClick={() => handleFeedback(message.id, 'like')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button
                            className={cn('p-1 rounded hover:bg-background/50 transition-colors', message.feedback === 'dislike' && 'text-red-500')}
                            onClick={() => handleFeedback(message.id, 'dislike')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-background/50 transition-colors"
                            onClick={() => handleCopy(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-6 h-6 rounded-md bg-primary/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="px-3 py-2 border-t border-border shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 max-h-20"
                style={{ minHeight: '36px' }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Powered by AI · Responses may not always be accurate
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default AIChatInterface;
