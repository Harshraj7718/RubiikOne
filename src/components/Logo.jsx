// The RUBIIK wordmark: ivory letters with the two gold I's and the double-bar emblem.

export function Emblem({ className = "h-8", animate = false }) {
  return (
    <svg viewBox="0 0 40 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="emblem-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3dfae" />
          <stop offset="0.55" stopColor="#8c6a35" />
          <stop offset="1" stopColor="#d9b979" />
        </linearGradient>
      </defs>
      <path d="M6 0h7l-1.2 100h-4.6zM27 0h7l-1.2 100h-4.6z" fill="url(#emblem-gold)">
        {animate && <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />}
      </path>
    </svg>
  );
}

export function Wordmark({ className = "", spacing = "0.32em" }) {
  return (
    <span className={`font-serif font-normal ${className}`} style={{ letterSpacing: spacing }} aria-label="RUBIIK">
      RUB<span className="text-gold">II</span>K
    </span>
  );
}

export default function Logo({ className = "" }) {
  return (
    <span className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <Emblem className="h-4" />
      <Wordmark className="text-lg leading-none" />
    </span>
  );
}
