import { useState, useMemo } from 'react';
import { FileText, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function TextCounter({ className }: { className?: string }) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
    const lines = text.split('\n').length;

    const readingTime = Math.ceil(words / 200);
    const speakingTime = Math.ceil(words / 150);

    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      readingTime,
      speakingTime
    };
  }, [text]);

  const copyStats = async () => {
    const statsText = `Characters: ${stats.characters}\nWords: ${stats.words}\nSentences: ${stats.sentences}\nParagraphs: ${stats.paragraphs}\nReading time: ${stats.readingTime} min`;
    await navigator.clipboard.writeText(statsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Text Counter</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={copyStats}>
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          <span className="ml-1">Copy Stats</span>
        </Button>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text here..."
          className="w-full px-4 py-3 bg-muted rounded-lg resize-none h-40"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Characters', value: stats.characters },
            { label: 'No Spaces', value: stats.charactersNoSpaces },
            { label: 'Words', value: stats.words },
            { label: 'Sentences', value: stats.sentences },
            { label: 'Paragraphs', value: stats.paragraphs },
            { label: 'Lines', value: stats.lines },
            { label: 'Reading Time', value: `${stats.readingTime} min` },
            { label: 'Speaking Time', value: `${stats.speakingTime} min` },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setText(text.toUpperCase())}
            disabled={!text}
          >
            UPPERCASE
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setText(text.toLowerCase())}
            disabled={!text}
          >
            lowercase
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setText(text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '))}
            disabled={!text}
          >
            Title Case
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setText('')}
            disabled={!text}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TextCounter;
