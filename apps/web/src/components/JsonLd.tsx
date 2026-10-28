/** "<" is escaped so admin-supplied text can never close the script tag. */
export function JsonLd({ data }: { data: object[] }) {
  return (
    <>
      {data.map((d, n) => (
        <script key={n} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, '\\u003c') }} />
      ))}
    </>
  );
}
