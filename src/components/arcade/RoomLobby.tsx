// ─── RoomLobby — Create/Join/Quick Match room lobby ──────────────────────────

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Copy, Check, Loader2, ArrowLeft, Plus, LogIn, Shuffle,
} from 'lucide-react';
import { toast } from 'sonner';

interface RoomLobbyProps {
  roomCode: string;
  isHost: boolean;
  opponentJoined: boolean;
  opponentName?: string;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartGame: () => void;
  onBack: () => void;
  /** If provided, shows a Quick Match button */
  onQuickMatch?: () => void;
  className?: string;
}

export function RoomLobby({
  roomCode,
  isHost,
  opponentJoined,
  opponentName,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onBack,
  onQuickMatch,
  className,
}: RoomLobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [view, setView] = useState<'choose' | 'create' | 'join'>('choose');

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCodeCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Choose view — pick create or join
  if (view === 'choose') {
    return (
      <div className={cn('max-w-md mx-auto space-y-4', className)}>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h3 className="text-xl font-bold text-center">Online Mode</h3>

        <div className="grid gap-3">
          <Button
            size="lg"
            className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white"
            onClick={() => {
              onCreateRoom();
              setView('create');
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Room
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 text-base border-2"
            onClick={() => setView('join')}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Join Room
          </Button>

          {onQuickMatch && (
            <Button
              size="lg"
              variant="secondary"
              className="w-full h-14 text-base"
              onClick={onQuickMatch}
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Quick Match
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Create view — show room code, wait for opponent
  if (view === 'create') {
    return (
      <div className={cn('max-w-md mx-auto space-y-6 text-center', className)}>
        <button
          onClick={() => {
            setView('choose');
            onBack();
          }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h3 className="text-xl font-bold">Your Room</h3>

        {/* Room code display */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Share this code with your opponent</p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-2">
              {roomCode.split('').map((digit, i) => (
                <div
                  key={i}
                  className="w-14 h-16 sm:w-16 sm:h-18 flex items-center justify-center rounded-xl bg-gradient-to-b from-primary/20 to-primary/10 border-2 border-primary/30 text-3xl font-mono font-bold"
                >
                  {digit}
                </div>
              ))}
            </div>
            <Button size="icon" variant="outline" onClick={copyCode} className="h-12 w-12">
              {codeCopied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Waiting state */}
        <div className="py-6">
          {opponentJoined ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-500">
                <Check className="w-5 h-5" />
                <span className="font-semibold">
                  {opponentName || 'Opponent'} joined!
                </span>
              </div>
              <Button
                size="lg"
                className="w-full h-14 text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
                onClick={onStartGame}
              >
                Start Game
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="absolute inset-0 w-10 h-10 rounded-full animate-ping bg-primary/20" />
              </div>
              <p className="text-muted-foreground animate-pulse">
                Waiting for opponent to join...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Join view — enter code
  return (
    <div className={cn('max-w-md mx-auto space-y-6', className)}>
      <button
        onClick={() => setView('choose')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h3 className="text-xl font-bold text-center">Join Room</h3>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Enter the 4-digit code from your opponent
        </p>

        <Input
          value={joinCode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setJoinCode(val);
          }}
          placeholder="0000"
          className="text-center text-3xl font-mono tracking-[0.5em] h-16 border-2"
          maxLength={4}
          inputMode="numeric"
        />

        <Button
          size="lg"
          className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white"
          disabled={joinCode.length !== 4}
          onClick={() => onJoinRoom(joinCode)}
        >
          Join Game
        </Button>
      </div>
    </div>
  );
}
