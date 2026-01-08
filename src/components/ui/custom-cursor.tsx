import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CursorPosition {
  x: number;
  y: number;
}

interface CustomCursorProps {
  enabled?: boolean;
  color?: string;
  size?: number;
  trailLength?: number;
}

export function CustomCursor({
  enabled = true,
  color = 'hsl(var(--primary))',
  size = 20,
  trailLength = 8,
}: CustomCursorProps) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [trail, setTrail] = useState<CursorPosition[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      setTrail((prev) => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY }];
        return newTrail.slice(-trailLength);
      });
    };

    const updateCursorType = () => {
      const element = document.elementFromPoint(position.x, position.y);
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        setIsPointer(
          computedStyle.cursor === 'pointer' ||
          element.tagName === 'A' ||
          element.tagName === 'BUTTON' ||
          element.closest('a') !== null ||
          element.closest('button') !== null
        );
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsHidden(true);
    const handleMouseEnter = () => setIsHidden(false);

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('mousemove', updateCursorType);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseleave', handleMouseLeave);
    document.body.addEventListener('mouseenter', handleMouseEnter);

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mousemove', updateCursorType);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.style.cursor = 'auto';
    };
  }, [enabled, position.x, position.y, trailLength]);

  if (!enabled || isHidden) return null;

  return (
    <>
      {/* Trail */}
      {trail.map((pos, index) => (
        <div
          key={index}
          className="fixed pointer-events-none z-[9998] rounded-full"
          style={{
            left: pos.x,
            top: pos.y,
            width: (size * 0.3) * ((index + 1) / trailLength),
            height: (size * 0.3) * ((index + 1) / trailLength),
            backgroundColor: color,
            opacity: 0.2 * ((index + 1) / trailLength),
            transform: 'translate(-50%, -50%)',
            transition: 'none',
          }}
        />
      ))}

      {/* Outer ring */}
      <div
        className={cn(
          'fixed pointer-events-none z-[9999] rounded-full border-2 transition-transform duration-150',
          isClicking && 'scale-75'
        )}
        style={{
          left: position.x,
          top: position.y,
          width: isPointer ? size * 1.5 : size,
          height: isPointer ? size * 1.5 : size,
          borderColor: color,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.15s, height 0.15s, transform 0.1s',
        }}
      />

      {/* Inner dot */}
      <div
        className={cn(
          'fixed pointer-events-none z-[9999] rounded-full transition-transform duration-100',
          isClicking && 'scale-150'
        )}
        style={{
          left: position.x,
          top: position.y,
          width: size * 0.25,
          height: size * 0.25,
          backgroundColor: color,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </>
  );
}

// Hook to use custom cursor state
export function useCustomCursor() {
  const [cursorText, setCursorText] = useState<string | null>(null);
  const [cursorVariant, setCursorVariant] = useState<'default' | 'text' | 'hidden'>('default');

  return {
    cursorText,
    setCursorText,
    cursorVariant,
    setCursorVariant,
  };
}

// Text cursor that follows mouse with custom text
interface TextCursorProps {
  text: string;
  visible: boolean;
}

export function TextCursor({ text, visible }: TextCursorProps) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updatePosition);
    return () => window.removeEventListener('mousemove', updatePosition);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999] px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full whitespace-nowrap"
      style={{
        left: position.x + 20,
        top: position.y + 20,
      }}
    >
      {text}
    </div>
  );
}

export default CustomCursor;
