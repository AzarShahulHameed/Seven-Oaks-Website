'use client';
import { EntryEditorScreen } from '@/components/admin/EntryAdmin';

export default function Page({ params }: { params: { id: string } }) { return <EntryEditorScreen kind="GALLERY" id={params.id} />; }
