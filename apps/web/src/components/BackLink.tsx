'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/** Takes the visitor to the page they came from (e.g. Parents). If they arrived straight on this page, it goes to the section page instead. */
export function BackLink({ fallback, label, className = '' }: { fallback: string; label: string; className?: string }) {
  const router = useRouter();
  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    let same = false;
    try { same = !!document.referrer && new URL(document.referrer).origin === window.location.origin; } catch { /* ignore */ }
    if (same && window.history.length > 1) router.back(); else router.push(fallback);
  };
  return (
    <a href={fallback} onClick={go} className={`group inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-primary shadow-card transition hover:-translate-y-0.5 hover:shadow-lg ${className}`}>
      <ArrowLeft aria-hidden className="h-4 w-4 transition group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />{label}
    </a>
  );
}
