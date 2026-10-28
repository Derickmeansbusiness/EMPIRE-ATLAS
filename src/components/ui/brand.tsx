import Link from "next/link";

export function AtlasMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none">
      <circle cx="24" cy="24" r="21" stroke="#C19B63" strokeWidth="1.5" />
      <path d="M24 6v36M6 24h36" stroke="#C19B63" strokeWidth="0.8" opacity="0.5" />
      <path d="M24 10 L36 34 H12 Z" stroke="#F7F5F0" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18 27 h12" stroke="#C19B63" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="2.2" fill="#C19B63" />
    </svg>
  );
}

export function Wordmark({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-3 focus-ring rounded-md">
      <AtlasMark className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[15deg]" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[1.05rem] tracking-[0.18em] text-ivory">EMPIRE ATLAS</span>
        {!compact && <span className="mt-1 text-[0.6rem] tracking-[0.28em] text-gold uppercase">The Anatomy of Great Fortunes</span>}
      </span>
    </Link>
  );
}
