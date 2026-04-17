// ─── useGameRoom — Supabase Realtime room management ─────────────────────────
// Extracted and generalized from the proven MathTugOfWar.tsx Realtime pattern.

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROOM } from './constants';
import type { GameSlug } from './types';

interface UseGameRoomOptions {
  gameSlug: GameSlug;
  playerName: string;
  onPlayerJoined?: (name: string) => void;
  onGameStart?: (payload: Record<string, unknown>) => void;
  onBroadcast?: (event: string, payload: Record<string, unknown>) => void;
  onDisconnect?: () => void;
}

interface UseGameRoomReturn {
  roomCode: string;
  isHost: boolean;
  isConnected: boolean;
  opponentJoined: boolean;
  opponentDisconnected: boolean;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  broadcast: (event: string, payload: Record<string, unknown>) => void;
  leaveRoom: () => void;
}

export function useGameRoom(options: UseGameRoomOptions): UseGameRoomReturn {
  const {
    gameSlug,
    playerName,
    onPlayerJoined,
    onGameStart,
    onBroadcast,
    onDisconnect,
  } = options;

  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  // Generate a 4-digit room code
  const generateRoomCode = useCallback(() => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }, []);

  // Set up the Supabase Realtime channel
  const setupChannel = useCallback(
    (code: string, hosting: boolean) => {
      // Clean up existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase.channel(`arcade-${gameSlug}-${code}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on('broadcast', { event: 'player_joined' }, ({ payload }) => {
          if (hosting) {
            setOpponentJoined(true);
            callbacksRef.current.onPlayerJoined?.(payload.name as string);
            toast.success(`${payload.name} joined the game!`);
          }
        })
        .on('broadcast', { event: 'game_start' }, ({ payload }) => {
          callbacksRef.current.onGameStart?.(payload as Record<string, unknown>);
        })
        .on('broadcast', { event: 'disconnect' }, () => {
          setOpponentDisconnected(true);
          callbacksRef.current.onDisconnect?.();
          toast.error('Opponent disconnected');
        })
        .on('broadcast', { event: '*' }, ({ event, payload }) => {
          // Forward all other events to the generic handler
          if (
            event !== 'player_joined' &&
            event !== 'game_start' &&
            event !== 'disconnect'
          ) {
            callbacksRef.current.onBroadcast?.(event, payload as Record<string, unknown>);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          }
        });

      channelRef.current = channel;
    },
    [gameSlug]
  );

  // Create a new room (host)
  const createRoom = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    setOpponentJoined(false);
    setOpponentDisconnected(false);
    setupChannel(code, true);
  }, [generateRoomCode, setupChannel]);

  // Join an existing room (guest)
  const joinRoom = useCallback(
    (code: string) => {
      if (code.length !== ROOM.CODE_LENGTH) {
        toast.error(`Enter a ${ROOM.CODE_LENGTH}-digit room code`);
        return;
      }
      setRoomCode(code);
      setIsHost(false);
      setOpponentDisconnected(false);
      setupChannel(code, false);

      // Notify the host after connection is established
      setTimeout(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'player_joined',
          payload: { name: playerName || 'Player 2' },
        });
      }, 1000);
    },
    [playerName, setupChannel]
  );

  // Send a broadcast event
  const broadcast = useCallback((event: string, payload: Record<string, unknown>) => {
    channelRef.current?.send({
      type: 'broadcast',
      event,
      payload,
    });
  }, []);

  // Leave the room and clean up
  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'disconnect',
        payload: {},
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRoomCode('');
    setIsHost(false);
    setIsConnected(false);
    setOpponentJoined(false);
    setOpponentDisconnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'disconnect',
          payload: {},
        });
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return {
    roomCode,
    isHost,
    isConnected,
    opponentJoined,
    opponentDisconnected,
    createRoom,
    joinRoom,
    broadcast,
    leaveRoom,
  };
}
