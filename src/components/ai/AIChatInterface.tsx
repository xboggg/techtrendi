import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  category: string;
}

const suggestedQuestions: SuggestedQuestion[] = [
  { text: 'What are the best smartphones for 2024?', category: 'Reviews' },
  { text: 'How do I improve my online privacy?', category: 'Security' },
  { text: 'Compare iPhone 15 vs Samsung S24', category: 'Comparison' },
  { text: 'What laptop should I buy for programming?', category: 'Guides' },
];

// AI response generator (simulated - in production, connect to AI API)
const generateAIResponse = async (message: string, history: Message[]): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

  const lowercaseMsg = message.toLowerCase();

  // Context-aware responses
  if (lowercaseMsg.includes('smartphone') || lowercaseMsg.includes('phone')) {
    return `Based on our latest reviews, here are the top smartphones for 2024:

**Flagship Picks:**
1. **iPhone 15 Pro Max** - Best overall iOS experience with A17 Pro chip
2. **Samsung Galaxy S24 Ultra** - Best Android with AI features and S Pen
3. **Google Pixel 8 Pro** - Best camera and pure Android experience

**Mid-Range Value:**
- OnePlus 12R - Great performance for the price
- Samsung A54 - Reliable with good updates

Would you like me to compare any specific models or discuss features in detail?`;
  }

  if (lowercaseMsg.includes('privacy') || lowercaseMsg.includes('security')) {
    return `Here are essential tips to improve your online privacy:

**Immediate Steps:**
1. Use a password manager (Bitwarden, 1Password)
2. Enable 2FA on all accounts
3. Use a VPN for public WiFi
4. Review app permissions regularly

**Browser Security:**
- Switch to Firefox or Brave
- Install uBlock Origin
- Use HTTPS Everywhere

**Advanced:**
- Consider a privacy-focused email (ProtonMail)
- Use encrypted messaging (Signal)

Check out our [Privacy Tools](/tools/privacy-checker) to scan your current setup!`;
  }

  if (lowercaseMsg.includes('compare') || lowercaseMsg.includes('vs')) {
    return `I'd be happy to help you compare devices! To give you the most accurate comparison, please tell me:

1. **Which specific models** you're considering?
2. **Your primary use case** (gaming, productivity, photography)?
3. **Budget range** (if applicable)?

You can also use our [Phone Comparison Tool](/tools/phone-comparison) for a detailed side-by-side analysis!`;
  }

  if (lowercaseMsg.includes('laptop') || lowercaseMsg.includes('computer')) {
    return `For laptop recommendations, I'll need to know your use case:

**For Programming:**
- MacBook Pro 14" M3 - Best for iOS/macOS dev
- ThinkPad X1 Carbon - Best for Linux/Windows dev
- Framework Laptop - Most repairable option

**For Gaming:**
- ASUS ROG Zephyrus G14
- Razer Blade 15
- Lenovo Legion Pro 7

**For General Use:**
- MacBook Air M3
- Dell XPS 13
- HP Spectre x360

What's your primary use case and budget?`;
  }

  // Default response
  return `Thanks for your question! I'm TechTrendi's AI assistant, here to help you with:

- **Product Reviews** - Get insights on the latest tech
- **Comparisons** - Find the best device for your needs
- **Security Tips** - Stay safe online
- **Buying Guides** - Make informed decisions

Could you tell me more about what you're looking for? For example:
- "Best budget phone under $500"
- "How to secure my home network"
- "Compare MacBook Air vs Dell XPS"`;
};

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Load chat history
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

    // Save user message
    if (user) {
      saveMessage('user', userMessage.content);
    }

    try {
      const response = await generateAIResponse(userMessage.content, messages);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message
      if (user) {
        saveMessage('assistant', assistantMessage.content);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg))
    );
    toast({
      title: 'Thanks for your feedback!',
      description: 'This helps us improve our responses.',
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard.',
    });
  };

  const handleClearChat = () => {
    setMessages([]);
    toast({
      title: 'Chat cleared',
      description: 'Starting a fresh conversation.',
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="sr-only">Open AI Chat</span>
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 bg-card border border-border rounded-2xl shadow-2xl transition-all duration-300',
        isMinimized ? 'w-80 h-14' : 'w-96 h-[600px] max-h-[80vh]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">TechTrendi AI</h3>
            {!isMinimized && (
              <p className="text-xs text-muted-foreground">Your tech assistant</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleClearChat} className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 h-[calc(100%-140px)] p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-purple-500" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">How can I help you today?</h4>
                  <p className="text-sm text-muted-foreground">
                    Ask me about tech products, comparisons, or security tips!
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Suggested questions:</p>
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(q.text)}
                      className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <Badge variant="secondary" className="mb-1 text-xs">
                        {q.category}
                      </Badge>
                      <p className="text-foreground">{q.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl p-3',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-6 w-6',
                              message.feedback === 'like' && 'text-green-500'
                            )}
                            onClick={() => handleFeedback(message.id, 'like')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-6 w-6',
                              message.feedback === 'dislike' && 'text-red-500'
                            )}
                            onClick={() => handleFeedback(message.id, 'dislike')}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about tech..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {!user && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                <a href="/auth" className="text-primary hover:underline">
                  Sign in
                </a>{' '}
                to save your chat history
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AIChatInterface;
