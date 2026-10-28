import { timingSafeEqual } from 'crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

const ALLOWED = new Set(['content', 'bootstrap']);

export async function POST(req: Request) {
  const given = Buffer.from(req.headers.get('x-revalidate-secret') ?? '');
  const want = Buffer.from(process.env.REVALIDATE_SECRET ?? '');
  if (!want.length || given.length !== want.length || !timingSafeEqual(given, want))
    return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { tags?: string[] };
  for (const tag of body.tags ?? []) if (ALLOWED.has(tag)) revalidateTag(tag);
  return NextResponse.json({ ok: true });
}
