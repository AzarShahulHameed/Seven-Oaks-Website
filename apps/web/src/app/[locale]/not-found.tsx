import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-container px-4 py-24 text-center">
      <h1>404</h1>
      <p className="mt-2">Page not found · الصفحة غير موجودة</p>
      <Link href="/" className="mt-6 inline-block font-bold">Home · الرئيسية</Link>
    </main>
  );
}
