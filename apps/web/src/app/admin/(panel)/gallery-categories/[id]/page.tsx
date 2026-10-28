'use client';
import { EntryEditorScreen } from '@/components/admin/EntryAdmin';

export default function Page({ params }: { params: { id: string } }) { return <EntryEditorScreen kind="CATEGORY" id={params.id} />; }
