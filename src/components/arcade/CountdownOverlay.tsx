// ─── CountdownOverlay — 3-2-1-GO fullscreen overlay ──────────────────────────

import { useState, useEffect, useRef } from 'react';

interface CountdownOverlayProps {
  onComplete: () => void;
  startFrom?: number;
}

export function CountdownOverlay({ onComplete, startFrom = 3 }: CountdownOverlayProps) {
  const [count, setCount] = useState(startFrom + 1); // +1 for GO
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const calledRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(interval);
          if (!calledRef.current) {
            calledRef.current = true;
            setTimeout(() => onCompleteRef.current(), 100);
          }
          return 0;
        }
        return c - 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, []);

  const display = count > 1 ? count - 1 : count === 1 ? 'GO!' : null;
  const colors = ['', 'text-green-400', 'text-yellow-400', 'text-red-500'];
  const colorClass = count > 1 ? (colors[count - 1] || 'text-white') : 'text-green-400';

  if (display === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="text-center animate-pulse">
        <span className={`text-[120px] sm:text-[180px] font-black drop-shadow-2xl ${colorClass}`}>
          {display}
        </span>
      </div>
    </div>
  );
}
