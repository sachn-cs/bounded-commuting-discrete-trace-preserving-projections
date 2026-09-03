import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="traceprojector"
      >
        <defs>
          <linearGradient
            id="logo-gradient"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="oklch(0.78 0.18 295)" />
            <stop offset="1" stopColor="oklch(0.82 0.16 200)" />
          </linearGradient>
        </defs>
        <g
          stroke="url(#logo-gradient)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 4 L27 11 L22.5 24.5 L9.5 24.5 L5 11 Z" />
          <path d="M16 4 L16 24.5" />
          <path d="M5 11 L22.5 24.5" />
          <path d="M27 11 L9.5 24.5" />
        </g>
        <circle cx="16" cy="11" r="2.2" fill="url(#logo-gradient)" />
      </svg>
      {showWordmark && (
        <span className="font-semibold tracking-tight">
          traceprojector
        </span>
      )}
    </div>
  );
}
