import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  Type,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const insertLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (url) {
      execCommand("createLink", url);
    }
  }, [execCommand]);

  const insertImage = useCallback(() => {
    const url = prompt("Enter image URL:");
    if (url) {
      execCommand("insertImage", url);
    }
  }, [execCommand]);

  const formatBlock = useCallback((tag: string) => {
    execCommand("formatBlock", tag);
  }, [execCommand]);

  const toolbarButtons = [
    { icon: Undo, action: () => execCommand("undo"), title: "Undo" },
    { icon: Redo, action: () => execCommand("redo"), title: "Redo" },
    { type: "separator" },
    { icon: Heading1, action: () => formatBlock("h1"), title: "Heading 1" },
    { icon: Heading2, action: () => formatBlock("h2"), title: "Heading 2" },
    { icon: Heading3, action: () => formatBlock("h3"), title: "Heading 3" },
    { icon: Type, action: () => formatBlock("p"), title: "Paragraph" },
    { type: "separator" },
    { icon: Bold, action: () => execCommand("bold"), title: "Bold" },
    { icon: Italic, action: () => execCommand("italic"), title: "Italic" },
    { icon: Underline, action: () => execCommand("underline"), title: "Underline" },
    { icon: Strikethrough, action: () => execCommand("strikeThrough"), title: "Strikethrough" },
    { type: "separator" },
    { icon: List, action: () => execCommand("insertUnorderedList"), title: "Bullet List" },
    { icon: ListOrdered, action: () => execCommand("insertOrderedList"), title: "Numbered List" },
    { type: "separator" },
    { icon: AlignLeft, action: () => execCommand("justifyLeft"), title: "Align Left" },
    { icon: AlignCenter, action: () => execCommand("justifyCenter"), title: "Align Center" },
    { icon: AlignRight, action: () => execCommand("justifyRight"), title: "Align Right" },
    { type: "separator" },
    { icon: Quote, action: () => formatBlock("blockquote"), title: "Quote" },
    { icon: Code, action: () => formatBlock("pre"), title: "Code Block" },
    { icon: Link, action: insertLink, title: "Insert Link" },
    { icon: Image, action: insertImage, title: "Insert Image" },
  ];

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-background", className)}>
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        {toolbarButtons.map((button, index) =>
          button.type === "separator" ? (
            <div key={index} className="w-px h-6 bg-border mx-1" />
          ) : (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={button.action}
              title={button.title}
            >
              {button.icon && <button.icon className="w-4 h-4" />}
            </Button>
          )
        )}
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none prose prose-sm dark:prose-invert max-w-none"
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        [contenteditable] blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          font-style: italic;
          margin: 1rem 0;
        }
        [contenteditable] pre {
          background: hsl(var(--muted));
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-family: monospace;
        }
        [contenteditable] a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
