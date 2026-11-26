// A country flag as a small picture (public/flags/<cc>.svg, the 54 African flags from the MIT
// "flag-icons" set, 26 Nov 2026). Flag emojis show as two letters ("GH") on Windows PCs, so the
// events pages use these pictures instead. Sized in em, so it sits inside text at any size.
export function Flag({ cc, className = "" }: { cc: string; className?: string }) {
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  return (
    <img
      src={`/flags/${cc.toLowerCase()}.svg`}
      alt=""
      aria-hidden="true"
      width={20}
      height={15}
      loading="lazy"
      decoding="async"
      className={`inline-block h-[0.85em] w-auto shrink-0 rounded-[2px] align-[-0.08em] shadow-sm ring-1 ring-black/10 ${className}`}
    />
  );
}
