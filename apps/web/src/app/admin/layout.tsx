import '../globals.css';
import './admin.css';

export const metadata = { title: 'Admin · Seven Oaks', robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="a-body">{children}</body>
    </html>
  );
}
