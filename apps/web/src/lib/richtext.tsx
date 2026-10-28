import Link from 'next/link';
import { localHref, safeHref } from '@/lib/i18n';

/** Turns **bold** and [label](address) into safe React nodes. No HTML from the admin is ever inserted as markup. */
export function inline(text: string, locale: string): React.ReactNode[] {
  const out: React.ReactNode[] = []; const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g; let last = 0, m: RegExpExecArray | null, n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={n++}>{tok.slice(2, -2)}</strong>);
    else { const [, label, href] = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(tok)!; const h = safeHref(href); out.push(h ? (h.startsWith('/') ? <Link key={n++} href={localHref(h, locale)} className="font-semibold text-link underline decoration-2 underline-offset-4 transition hover:opacity-80">{label}</Link> : <a key={n++} href={h} target="_blank" rel="noopener noreferrer" className="font-semibold text-link underline decoration-2 underline-offset-4 transition hover:opacity-80">{label}</a>) : label); }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Simple formatting for body text: blank line = new paragraph, "## " = heading, "- " = bullet, **bold**, [link](address). */
export function RichBody({ text, locale, className = '' }: { text: string; locale: string; className?: string }) {
  const blocks = String(text ?? '').replace(/\r/g, '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((b, i) => {
        if (b.startsWith('## ')) return <h3 key={i} className="pt-2 text-h4 font-bold text-primary">{inline(b.slice(3), locale)}</h3>;
        const lines = b.split('\n');
        if (lines.every((l) => /^[-•]\s+/.test(l.trim()))) return <ul key={i} className="ms-5 list-disc space-y-1.5 marker:text-accent">{lines.map((l, k) => <li key={k}>{inline(l.trim().replace(/^[-•]\s+/, ''), locale)}</li>)}</ul>;
        return <p key={i}>{lines.map((l, k) => <span key={k}>{k > 0 && <br />}{inline(l, locale)}</span>)}</p>;
      })}
    </div>
  );
}
