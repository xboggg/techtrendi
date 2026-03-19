import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { FileText, Copy, Check, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const loremWords = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "pellentesque", "habitant",
  "morbi", "tristique", "senectus", "netus", "malesuada", "fames", "turpis",
  "egestas", "proin", "nibh", "nisl", "condimentum", "viverra", "maecenas",
  "accumsan", "lacus", "vel", "facilisis", "volutpat", "blandit", "cursus",
  "risus", "ultricies", "gravida", "dictum", "fusce", "placerat", "orci",
];

export default function LoremIpsum() {
  const [output, setOutput] = useState("");
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [copied, setCopied] = useState(false);

  const generateWord = () => {
    return loremWords[Math.floor(Math.random() * loremWords.length)];
  };

  const generateSentence = (minWords = 8, maxWords = 15) => {
    const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(generateWord());
    }
    // Capitalize first word
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    // Add random commas
    if (wordCount > 6 && Math.random() > 0.5) {
      const commaPos = Math.floor(Math.random() * (wordCount - 3)) + 2;
      words[commaPos] = words[commaPos] + ",";
    }
    return words.join(" ") + ".";
  };

  const generateParagraph = (minSentences = 4, maxSentences = 8) => {
    const sentenceCount = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(" ");
  };

  const generate = () => {
    let result = "";

    if (type === "words") {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(generateWord());
      }
      if (startWithLorem && words.length >= 2) {
        words[0] = "Lorem";
        words[1] = "ipsum";
      }
      result = words.join(" ");
    } else if (type === "sentences") {
      const sentences = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence());
      }
      if (startWithLorem && sentences.length > 0) {
        sentences[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
      }
      result = sentences.join(" ");
    } else {
      const paragraphs = [];
      for (let i = 0; i < count; i++) {
        paragraphs.push(generateParagraph());
      }
      if (startWithLorem && paragraphs.length > 0) {
        paragraphs[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
          paragraphs[0].split(". ").slice(1).join(". ");
      }
      result = paragraphs.join("\n\n");
    }

    setOutput(result);
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lorem-ipsum.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate initial content
  useState(() => {
    generate();
  });

  const wordCount = output.split(/\s+/).filter(Boolean).length;
  const charCount = output.length;

  return (
    <Layout>
      <SEOHead
        title="Lorem Ipsum Generator"
        description="Need placeholder text? Generate paragraphs, sentences, or words of lorem ipsum for your designs and mockups."
        canonical="/tools/lorem-ipsum"
        keywords={["lorem ipsum generator", "placeholder text", "dummy text", "filler text", "lipsum"]}
      />
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Lorem Ipsum Generator</h1>
            <p className="text-muted-foreground">
              Generate placeholder text for your designs and layouts
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            {/* Type */}
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
              {(["paragraphs", "sentences", "words"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${
                    type === t
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Count */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Count:</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                min="1"
                max="100"
                className="w-20 px-3 py-2 rounded-lg border border-border bg-background text-center"
              />
            </div>

            {/* Start with Lorem */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={startWithLorem}
                onChange={(e) => setStartWithLorem(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Start with "Lorem ipsum"</span>
            </label>

            {/* Generate Button */}
            <Button onClick={generate} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Generate
            </Button>
          </div>

          {/* Output */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                {wordCount} words • {charCount} characters
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyOutput}
                  disabled={!output}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={downloadOutput}
                  disabled={!output}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            <div className="min-h-[300px] p-6 rounded-xl border border-border bg-muted/30 text-foreground whitespace-pre-wrap leading-relaxed">
              {output || (
                <span className="text-muted-foreground">
                  Click "Generate" to create lorem ipsum text...
                </span>
              )}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setType("paragraphs");
                setCount(1);
                setTimeout(generate, 0);
              }}
            >
              1 Paragraph
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setType("paragraphs");
                setCount(3);
                setTimeout(generate, 0);
              }}
            >
              3 Paragraphs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setType("sentences");
                setCount(5);
                setTimeout(generate, 0);
              }}
            >
              5 Sentences
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setType("words");
                setCount(50);
                setTimeout(generate, 0);
              }}
            >
              50 Words
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setType("words");
                setCount(100);
                setTimeout(generate, 0);
              }}
            >
              100 Words
            </Button>
          </div>

          {/* Info */}
          <div className="p-6 bg-muted/30 rounded-xl">
            <h2 className="font-semibold mb-4">About Lorem Ipsum</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h3 className="font-medium text-foreground mb-2">What is it?</h3>
                <p>
                  Lorem Ipsum is placeholder text commonly used in the graphic,
                  print, and publishing industries. It's been the industry's
                  standard dummy text since the 1500s.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Why use it?</h3>
                <ul className="space-y-1">
                  <li>• Preview layouts without real content</li>
                  <li>• Test typography and spacing</li>
                  <li>• Focus on design, not content</li>
                  <li>• Industry-standard placeholder</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
