import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Volume2, VolumeX, Mic, MicOff, Play, Pause, Square,
  Copy, Trash2, Languages, Type, AudioLines, Clock, Hash,
  Download, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Extend Window for SpeechRecognition browser compat
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

const SAMPLE_TEXTS = [
  {
    label: "News Article",
    text: "Technology continues to reshape how we work, learn, and communicate. From artificial intelligence to quantum computing, the pace of innovation is accelerating at an unprecedented rate. Experts predict that the next decade will bring transformative changes to nearly every industry.",
  },
  {
    label: "Pangram",
    text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!",
  },
  {
    label: "Motivational",
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts. The only way to do great work is to love what you do. Believe you can and you're halfway there.",
  },
  {
    label: "Technical",
    text: "Machine learning algorithms analyze patterns in data to make predictions without being explicitly programmed. Deep learning, a subset of machine learning, uses neural networks with multiple layers to model complex abstractions in data.",
  },
];

const STT_LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese (BR)" },
  { code: "zh-CN", label: "Chinese (Mandarin)" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "ar-SA", label: "Arabic" },
  { code: "hi-IN", label: "Hindi" },
];

export default function TextToSpeech() {
  // === TTS State ===
  const [ttsText, setTtsText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // === Download State ===
  const [isRecording, setIsRecording] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("wav");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // === STT State ===
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [sttLanguage, setSttLanguage] = useState("en-US");
  const [sttSupported, setSttSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>(Array(20).fill(4));
  const animationRef = useRef<number | null>(null);

  // === Load voices ===
  useEffect(() => {
    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
        if (!selectedVoice && available.length > 0) {
          const defaultVoice = available.find((v) => v.default) || available[0];
          setSelectedVoice(defaultVoice.name);
        }
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // === Check STT support ===
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
    }
  }, []);

  // === TTS Functions ===
  const words = ttsText.split(/\s+/).filter(Boolean);
  const charCount = ttsText.length;
  const wordCount = words.length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / (150 * rate)));

  const handleSpeak = useCallback(() => {
    if (!ttsText.trim()) {
      toast.error("Please enter some text to speak.");
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(ttsText);
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        // Find which word index we're at based on char offset
        const charIndex = event.charIndex;
        let idx = 0;
        let pos = 0;
        const textChars = ttsText;
        // Skip leading whitespace
        while (pos < textChars.length && /\s/.test(textChars[pos])) pos++;
        while (pos < textChars.length && pos < charIndex) {
          if (/\s/.test(textChars[pos])) {
            idx++;
            while (pos < textChars.length && /\s/.test(textChars[pos])) pos++;
          } else {
            pos++;
          }
        }
        setCurrentWordIndex(idx);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  }, [ttsText, selectedVoice, rate, pitch, volume, voices]);

  const handlePause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
  };

  // === Download / Record TTS audio ===
  const handleDownload = useCallback(async () => {
    if (!ttsText.trim()) {
      toast.error("Please enter some text first.");
      return;
    }

    try {
      // Request system audio capture via getDisplayMedia
      // User will need to select a tab/window and enable "Share audio"
      toast.info("A screen share dialog will appear. Select any tab and check 'Share audio' to capture the speech output.", { duration: 6000 });

      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true, // required by some browsers even if we only want audio
        audio: true,
      });

      // Check if audio track exists
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        toast.error("No audio track captured. Make sure to check 'Share audio' in the dialog.");
        return;
      }

      // Create audio-only stream
      const audioStream = new MediaStream(audioTracks);
      streamRef.current = stream;

      // Stop video tracks (we don't need them)
      stream.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(audioStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = downloadFormat === "wav" ? "wav" : downloadFormat === "aac" ? "aac" : "webm";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tts-audio.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Audio downloaded!");

        // Cleanup
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        streamRef.current = null;
        setIsRecording(false);
      };

      // Start recording
      mediaRecorder.start(100);
      setIsRecording(true);

      // Now speak the text
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(ttsText);
      const voice = voices.find((v) => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onend = () => {
        // Small delay to capture trailing audio
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
        }, 500);
      };

      utterance.onerror = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        toast.error("Speech synthesis failed during recording.");
      };

      speechSynthesis.speak(utterance);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Screen share was cancelled. Download requires audio capture permission.");
      } else {
        toast.error("Download failed. Your browser may not support audio capture.");
        console.error("Download error:", err);
      }
      setIsRecording(false);
    }
  }, [ttsText, selectedVoice, rate, pitch, volume, voices, downloadFormat]);

  const cancelRecording = useCallback(() => {
    speechSynthesis.cancel();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    toast.info("Recording cancelled.");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // === STT Functions ===
  const animateBars = useCallback(() => {
    setBarHeights(
      Array(20)
        .fill(0)
        .map(() => Math.random() * 28 + 4)
    );
    animationRef.current = requestAnimationFrame(() => {
      setTimeout(() => {
        if (animationRef.current !== null) {
          animateBars();
        }
      }, 100);
    });
  }, []);

  const stopBarAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setBarHeights(Array(20).fill(4));
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sttLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      animateBars();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText);
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
      stopBarAnimation();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      stopBarAnimation();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sttLanguage, animateBars, stopBarAnimation]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    stopBarAnimation();
  }, [stopBarAnimation]);

  const copyTranscript = () => {
    if (transcript.trim()) {
      navigator.clipboard.writeText(transcript.trim());
      toast.success("Transcript copied to clipboard!");
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
  };

  // === Render highlighted text ===
  const renderHighlightedText = () => {
    if (!ttsText.trim()) return null;
    return (
      <div className="p-4 rounded-lg bg-muted/30 border text-sm leading-relaxed max-h-40 overflow-y-auto">
        {words.map((word, idx) => (
          <span
            key={idx}
            className={cn(
              "transition-colors duration-150 inline",
              idx === currentWordIndex
                ? "bg-primary text-primary-foreground rounded px-0.5"
                : "text-foreground"
            )}
          >
            {word}{" "}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <SEOHead
        title="Text to Speech & Speech to Text - Free Browser Tool | TechTrendi"
        description="Free text-to-speech and speech-to-text tool. Convert text to natural speech or transcribe your voice to text. Works entirely in your browser, no API calls needed."
        canonicalUrl="https://techtrendi.com/tools/text-to-speech"
      />

      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Text to Speech & <span className="text-primary">Speech to Text</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Convert text to natural-sounding speech or transcribe your voice to text.
            Works entirely in your browser — no API calls, completely free.
          </p>
        </div>

        <Tabs defaultValue="tts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tts" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Text to Speech
            </TabsTrigger>
            <TabsTrigger value="stt" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Speech to Text
            </TabsTrigger>
          </TabsList>

          {/* ===================== TEXT TO SPEECH TAB ===================== */}
          <TabsContent value="tts">
            <div className="space-y-6">
              {/* Text Input + Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Type className="w-5 h-5" />
                    Enter Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Type or paste the text you want to hear spoken aloud..."
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    className="min-h-[160px] text-base resize-y"
                  />

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      {charCount} characters
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5" />
                      {wordCount} words
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      ~{estimatedReadTime} min read
                    </div>
                  </div>

                  {/* Sample texts */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Quick samples:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {SAMPLE_TEXTS.map((sample) => (
                        <Button
                          key={sample.label}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setTtsText(sample.text)}
                        >
                          {sample.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Word highlight preview */}
                  <AnimatePresence>
                    {isSpeaking && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Currently reading:
                        </Label>
                        {renderHighlightedText()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Voice & Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AudioLines className="w-5 h-5" />
                    Voice Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Voice selector */}
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {voices.map((voice) => (
                          <SelectItem key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Speed */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Speed</Label>
                      <span className="text-sm text-muted-foreground font-mono">
                        {rate.toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      value={[rate]}
                      onValueChange={(v) => setRate(v[0])}
                      min={0.5}
                      max={2}
                      step={0.1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0.5x</span>
                      <span>2x</span>
                    </div>
                  </div>

                  {/* Pitch */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Pitch</Label>
                      <span className="text-sm text-muted-foreground font-mono">
                        {pitch.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[pitch]}
                      onValueChange={(v) => setPitch(v[0])}
                      min={0.5}
                      max={2}
                      step={0.1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  {/* Volume */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        {volume > 0 ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                        Volume
                      </Label>
                      <span className="text-sm text-muted-foreground font-mono">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[volume]}
                      onValueChange={(v) => setVolume(v[0])}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Playback Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-center gap-3">
                    {!isSpeaking ? (
                      <Button
                        size="lg"
                        onClick={handleSpeak}
                        className="h-14 px-8 text-lg bg-primary hover:bg-primary/90"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Speak
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          onClick={isPaused ? handleResume : handlePause}
                          variant="outline"
                          className="h-14 px-6"
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-5 h-5 mr-2" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="w-5 h-5 mr-2" />
                              Pause
                            </>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          onClick={handleStop}
                          variant="destructive"
                          className="h-14 px-6"
                        >
                          <Square className="w-5 h-5 mr-2" />
                          Stop
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Speaking indicator */}
                  <AnimatePresence>
                    {isSpeaking && !isPaused && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center items-center gap-1 mt-4"
                      >
                        {[0, 1, 2, 3, 4].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-primary rounded-full"
                            animate={{
                              height: [4, 16, 8, 20, 4],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                        <span className="ml-3 text-sm text-muted-foreground">
                          Speaking...
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Download Audio Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Download className="w-5 h-5" />
                    Download Audio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Record the speech output and download it as an audio file. Your browser will ask you to share a tab -- make sure to check "Share audio" to capture the speech.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Format</Label>
                      <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="webm">WebM (best quality)</SelectItem>
                          <SelectItem value="wav">WAV</SelectItem>
                          <SelectItem value="aac">AAC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      {!isRecording ? (
                        <Button
                          onClick={handleDownload}
                          disabled={!ttsText.trim() || isSpeaking}
                          className="h-10"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Record & Download
                        </Button>
                      ) : (
                        <Button
                          onClick={cancelRecording}
                          variant="destructive"
                          className="h-10"
                        >
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Recording... Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  {isRecording && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      Recording speech... The file will download automatically when finished.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===================== SPEECH TO TEXT TAB ===================== */}
          <TabsContent value="stt">
            <div className="space-y-6">
              {!sttSupported ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12 space-y-4">
                      <MicOff className="w-16 h-16 mx-auto text-muted-foreground/50" />
                      <h3 className="text-xl font-semibold text-foreground">
                        Speech Recognition Not Supported
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Your browser does not support the Web Speech API for speech recognition.
                        Please try using Google Chrome, Microsoft Edge, or another Chromium-based
                        browser for the best experience.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Language & Mic Controls */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Languages className="w-5 h-5" />
                        Language & Controls
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Recognition Language</Label>
                        <Select value={sttLanguage} onValueChange={setSttLanguage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STT_LANGUAGES.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Big Mic Button */}
                      <div className="flex justify-center py-6">
                        <motion.button
                          onClick={isListening ? stopListening : startListening}
                          className={cn(
                            "relative w-28 h-28 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isListening
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-primary hover:bg-primary/90 text-primary-foreground"
                          )}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Pulse rings when listening */}
                          {isListening && (
                            <>
                              <motion.span
                                className="absolute inset-0 rounded-full bg-red-500/30"
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeOut",
                                }}
                              />
                              <motion.span
                                className="absolute inset-0 rounded-full bg-red-500/20"
                                animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeOut",
                                  delay: 0.3,
                                }}
                              />
                            </>
                          )}
                          {isListening ? (
                            <MicOff className="w-10 h-10 relative z-10" />
                          ) : (
                            <Mic className="w-10 h-10 relative z-10" />
                          )}
                        </motion.button>
                      </div>

                      <p className="text-center text-sm text-muted-foreground">
                        {isListening
                          ? "Listening... Click the microphone to stop."
                          : "Click the microphone to start recording."}
                      </p>

                      {/* Waveform visualization */}
                      <div className="flex items-end justify-center gap-[3px] h-10">
                        {barHeights.map((h, i) => (
                          <motion.div
                            key={i}
                            className={cn(
                              "w-1.5 rounded-full",
                              isListening ? "bg-red-500" : "bg-muted-foreground/20"
                            )}
                            animate={{ height: h }}
                            transition={{ duration: 0.1, ease: "easeOut" }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transcription Output */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Type className="w-5 h-5" />
                          Transcription
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyTranscript}
                            disabled={!transcript.trim()}
                          >
                            <Copy className="w-4 h-4 mr-1.5" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearTranscript}
                            disabled={!transcript.trim() && !interimTranscript}
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Clear
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="min-h-[200px] p-4 rounded-lg bg-muted/30 border text-base leading-relaxed">
                        {!transcript && !interimTranscript ? (
                          <p className="text-muted-foreground/50 italic">
                            Your transcribed text will appear here...
                          </p>
                        ) : (
                          <>
                            <span className="text-foreground">{transcript}</span>
                            {interimTranscript && (
                              <span className="text-muted-foreground/60 italic">
                                {interimTranscript}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {transcript && (
                        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5" />
                            {transcript.trim().length} characters
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5" />
                            {transcript.trim().split(/\s+/).filter(Boolean).length} words
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" />
                  Text to Speech
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>- Uses your browser's built-in SpeechSynthesis API</li>
                  <li>- Choose from all voices installed on your device</li>
                  <li>- Adjust speed, pitch, and volume to your preference</li>
                  <li>- Words are highlighted as they are spoken</li>
                  <li>- No data leaves your browser</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-primary" />
                  Speech to Text
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>- Uses the Web Speech Recognition API</li>
                  <li>- Supports multiple languages</li>
                  <li>- Shows real-time interim results as you speak</li>
                  <li>- Best supported in Chrome and Edge browsers</li>
                  <li>- Copy your transcription with one click</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
