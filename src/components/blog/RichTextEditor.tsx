import { useState, useRef, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Maximize,
  Minimize,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

interface ToolbarButton {
  icon: React.ElementType;
  command: string;
  value?: string;
  title: string;
}

const toolbarGroups: ToolbarButton[][] = [
  [
    { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: Underline, command: 'underline', title: 'Underline (Ctrl+U)' },
    { icon: Strikethrough, command: 'strikeThrough', title: 'Strikethrough' },
  ],
  [
    { icon: Heading1, command: 'formatBlock', value: 'H1', title: 'Heading 1' },
    { icon: Heading2, command: 'formatBlock', value: 'H2', title: 'Heading 2' },
    { icon: Heading3, command: 'formatBlock', value: 'H3', title: 'Heading 3' },
  ],
  [
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    { icon: Quote, command: 'formatBlock', value: 'BLOCKQUOTE', title: 'Quote' },
    { icon: Code, command: 'formatBlock', value: 'PRE', title: 'Code Block' },
  ],
  [
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
  ],
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  minHeight = '300px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          executeCommand('undo');
          break;
        case 'y':
          e.preventDefault();
          executeCommand('redo');
          break;
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      executeCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  return (
    <div
      className={cn(
        'border border-border rounded-xl overflow-hidden bg-card',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50">
        {toolbarGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex items-center gap-0.5">
            {group.map((button) => (
              <button
                key={button.command + (button.value || '')}
                onClick={() => executeCommand(button.command, button.value)}
                className="p-2 rounded hover:bg-muted transition-colors"
                title={button.title}
                type="button"
              >
                <button.icon className="w-4 h-4" />
              </button>
            ))}
            {groupIndex < toolbarGroups.length - 1 && (
              <div className="w-px h-6 bg-border mx-1" />
            )}
          </div>
        ))}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link */}
        <button
          onClick={() => setShowLinkModal(true)}
          className="p-2 rounded hover:bg-muted transition-colors"
          title="Insert Link"
          type="button"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        {/* Image */}
        <button
          onClick={insertImage}
          className="p-2 rounded hover:bg-muted transition-colors"
          title="Insert Image"
          type="button"
        >
          <Image className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <button
          onClick={() => executeCommand('undo')}
          className="p-2 rounded hover:bg-muted transition-colors"
          title="Undo"
          type="button"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => executeCommand('redo')}
          className="p-2 rounded hover:bg-muted transition-colors"
          title="Redo"
          type="button"
        >
          <Redo className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded hover:bg-muted transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          type="button"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: value }}
        className={cn(
          'p-4 outline-none prose prose-sm dark:prose-invert max-w-none overflow-y-auto',
          'focus:ring-2 focus:ring-primary/20'
        )}
        style={{ minHeight }}
        data-placeholder={placeholder}
      />

      {/* Link Modal */}
      {showLinkModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowLinkModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-xl p-4 z-50 w-96">
            <h3 className="font-semibold text-foreground mb-4">Insert Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowLinkModal(false)}>
                Cancel
              </Button>
              <Button onClick={insertLink}>Insert</Button>
            </div>
          </div>
        </>
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
}

// Markdown Editor Alternative
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, className }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <div className={cn('border border-border rounded-xl overflow-hidden bg-card', className)}>
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50">
        <button onClick={() => insertMarkdown('**', '**')} className="p-2 rounded hover:bg-muted" title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown('*', '*')} className="p-2 rounded hover:bg-muted" title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown('# ')} className="p-2 rounded hover:bg-muted" title="Heading">
          <Heading1 className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown('[', '](url)')} className="p-2 rounded hover:bg-muted" title="Link">
          <LinkIcon className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown('`', '`')} className="p-2 rounded hover:bg-muted" title="Code">
          <Code className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown('- ')} className="p-2 rounded hover:bg-muted" title="List">
          <List className="w-4 h-4" />
        </button>
        <button onClick={() => insertMarkdown('> ')} className="p-2 rounded hover:bg-muted" title="Quote">
          <Quote className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <Button variant={preview ? 'default' : 'outline'} size="sm" onClick={() => setPreview(!preview)}>
          {preview ? 'Edit' : 'Preview'}
        </Button>
      </div>
      {preview ? (
        <div className="p-4 prose prose-sm dark:prose-invert max-w-none min-h-[300px]">
          <div dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(value) }} />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 bg-transparent border-none outline-none resize-none min-h-[300px] font-mono text-sm"
        />
      )}
    </div>
  );
}

function simpleMarkdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*)\*/g, '<em>$1</em>')
    .replace(/`(.*)`/g, '<code>$1</code>')
    .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>');
}

export default RichTextEditor;
