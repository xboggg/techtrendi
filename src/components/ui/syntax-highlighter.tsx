import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Copy, Terminal } from 'lucide-react';

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
  title?: string;
}

// Simple syntax highlighting without external dependencies
const tokenize = (code: string, language: string): string => {
  let html = code
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Language-specific patterns
  const patterns: Record<string, [RegExp, string][]> = {
    javascript: [
      [/\/\/.*$/gm, 'comment'],
      [/\/\*[\s\S]*?\*\//g, 'comment'],
      [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, 'string'],
      [/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|super|extends|static|get|set|typeof|instanceof|in|of|switch|case|default|break|continue|do)\b/g, 'keyword'],
      [/\b(true|false|null|undefined|NaN|Infinity)\b/g, 'boolean'],
      [/\b(\d+\.?\d*)\b/g, 'number'],
      [/\b([A-Z][a-zA-Z0-9]*)\b/g, 'class'],
      [/\b(console|window|document|Math|JSON|Array|Object|String|Number|Boolean|Date|Promise|Map|Set|Symbol)\b/g, 'builtin'],
    ],
    typescript: [
      [/\/\/.*$/gm, 'comment'],
      [/\/\*[\s\S]*?\*\//g, 'comment'],
      [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, 'string'],
      [/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|super|extends|static|get|set|typeof|instanceof|in|of|switch|case|default|break|continue|do|interface|type|enum|namespace|module|declare|readonly|public|private|protected|implements|abstract|as|is)\b/g, 'keyword'],
      [/\b(true|false|null|undefined|NaN|Infinity)\b/g, 'boolean'],
      [/\b(\d+\.?\d*)\b/g, 'number'],
      [/\b([A-Z][a-zA-Z0-9]*)\b/g, 'class'],
      [/:\s*(string|number|boolean|any|void|never|unknown|object)\b/g, 'type'],
    ],
    python: [
      [/#.*$/gm, 'comment'],
      [/"""[\s\S]*?"""|'''[\s\S]*?'''/g, 'string'],
      [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, 'string'],
      [/\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|in|is|global|nonlocal|assert|del)\b/g, 'keyword'],
      [/\b(True|False|None)\b/g, 'boolean'],
      [/\b(\d+\.?\d*)\b/g, 'number'],
      [/\b([A-Z][a-zA-Z0-9]*)\b/g, 'class'],
      [/\b(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance|hasattr|getattr|setattr|open|input)\b/g, 'builtin'],
    ],
    html: [
      [/&lt;!--[\s\S]*?--&gt;/g, 'comment'],
      [/&lt;\/?([a-zA-Z][a-zA-Z0-9]*)/g, 'tag'],
      [/([a-zA-Z-]+)=/g, 'attr-name'],
      [/"[^"]*"|'[^']*'/g, 'string'],
    ],
    css: [
      [/\/\*[\s\S]*?\*\//g, 'comment'],
      [/([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/g, 'selector'],
      [/([a-zA-Z-]+)\s*:/g, 'property'],
      [/#[0-9a-fA-F]{3,8}\b/g, 'color'],
      [/\b(\d+\.?\d*(px|em|rem|%|vh|vw|deg|s|ms)?)\b/g, 'number'],
      [/"[^"]*"|'[^']*'/g, 'string'],
    ],
    json: [
      [/"[^"]*"\s*:/g, 'property'],
      [/"[^"]*"/g, 'string'],
      [/\b(true|false|null)\b/g, 'boolean'],
      [/\b-?\d+\.?\d*\b/g, 'number'],
    ],
    bash: [
      [/#.*$/gm, 'comment'],
      [/"(?:[^"\\]|\\.)*"|'[^']*'/g, 'string'],
      [/\$[a-zA-Z_][a-zA-Z0-9_]*/g, 'variable'],
      [/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|cd|ls|rm|mv|cp|mkdir|chmod|chown|grep|sed|awk|cat|head|tail|find|xargs|pipe|sudo|apt|npm|yarn|git|docker)\b/g, 'keyword'],
    ],
  };

  const langPatterns = patterns[language] || patterns.javascript;

  // Apply patterns
  langPatterns.forEach(([pattern, className]) => {
    html = html.replace(pattern, (match) => {
      // Avoid double-wrapping
      if (match.includes('<span class="')) return match;
      return `<span class="token-${className}">${match}</span>`;
    });
  });

  return html;
};

export function SyntaxHighlighter({
  code,
  language = 'javascript',
  showLineNumbers = true,
  highlightLines = [],
  className,
  title,
}: SyntaxHighlighterProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');
  const highlightedCode = tokenize(code, language);
  const highlightedLines = highlightedCode.split('\n');

  return (
    <div className={cn('rounded-xl overflow-hidden bg-[#1e1e1e]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">{title || language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code>
            {highlightedLines.map((line, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  highlightLines.includes(index + 1) && 'bg-yellow-500/10 -mx-4 px-4'
                )}
              >
                {showLineNumbers && (
                  <span className="select-none text-gray-500 w-8 text-right mr-4 flex-shrink-0">
                    {index + 1}
                  </span>
                )}
                <span
                  className="flex-1"
                  dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
                />
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Syntax highlighting styles */}
      <style>{`
        .token-comment { color: #6a9955; }
        .token-string { color: #ce9178; }
        .token-keyword { color: #569cd6; }
        .token-boolean { color: #569cd6; }
        .token-number { color: #b5cea8; }
        .token-class { color: #4ec9b0; }
        .token-builtin { color: #dcdcaa; }
        .token-type { color: #4ec9b0; }
        .token-tag { color: #569cd6; }
        .token-attr-name { color: #9cdcfe; }
        .token-selector { color: #d7ba7d; }
        .token-property { color: #9cdcfe; }
        .token-color { color: #ce9178; }
        .token-variable { color: #9cdcfe; }
      `}</style>
    </div>
  );
}

// Inline code component
interface InlineCodeProps {
  children: string;
  className?: string;
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code
      className={cn(
        'px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm',
        className
      )}
    >
      {children}
    </code>
  );
}

// Code block with tabs for multiple files
interface CodeFile {
  name: string;
  language: string;
  code: string;
}

interface MultiFileCodeProps {
  files: CodeFile[];
  className?: string;
}

export function MultiFileCode({ files, className }: MultiFileCodeProps) {
  const [activeFile, setActiveFile] = useState(0);

  return (
    <div className={cn('rounded-xl overflow-hidden bg-[#1e1e1e]', className)}>
      {/* File tabs */}
      <div className="flex overflow-x-auto bg-[#252526] border-b border-[#3d3d3d]">
        {files.map((file, index) => (
          <button
            key={file.name}
            onClick={() => setActiveFile(index)}
            className={cn(
              'px-4 py-2 text-sm border-r border-[#3d3d3d] transition-colors whitespace-nowrap',
              index === activeFile
                ? 'bg-[#1e1e1e] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#2d2d2d]'
            )}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* Active file code */}
      <SyntaxHighlighter
        code={files[activeFile].code}
        language={files[activeFile].language}
        className="rounded-none"
      />
    </div>
  );
}

export default SyntaxHighlighter;
