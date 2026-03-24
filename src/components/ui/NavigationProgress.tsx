import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

export function NavigationProgress() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(location.pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;

    // Start the bar
    setVisible(true);
    setProgress(15);

    // Quickly ramp to ~90%
    let current = 15;
    intervalRef.current = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 90) {
        current = 90;
        clearInterval(intervalRef.current);
      }
      setProgress(current);
    }, 100);

    // Complete after a short delay (page content has mounted by now)
    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }, 400);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timerRef.current);
    };
  }, [location.pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : progress === 100 ? "width 200ms ease-out, opacity 200ms ease-out" : "width 300ms ease-out",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
