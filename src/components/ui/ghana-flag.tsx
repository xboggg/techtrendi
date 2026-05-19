interface GhanaFlagProps {
  className?: string;
  title?: string;
}

export function GhanaFlag({ className = "w-4 h-3", title = "Ghana" }: GhanaFlagProps) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      {/* Red stripe */}
      <rect width="60" height="13.33" y="0" fill="#ce1126" />
      {/* Yellow stripe */}
      <rect width="60" height="13.33" y="13.33" fill="#fcd116" />
      {/* Green stripe */}
      <rect width="60" height="13.34" y="26.66" fill="#006b3f" />
      {/* Black star (5-pointed) centred in yellow */}
      <polygon
        points="30,15 31.18,18.62 35,18.62 31.91,20.86 33.09,24.48 30,22.24 26.91,24.48 28.09,20.86 25,18.62 28.82,18.62"
        fill="#000000"
      />
    </svg>
  );
}
