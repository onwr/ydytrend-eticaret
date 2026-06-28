import { safeJsonLdStringify } from "@/lib/jsonLd"

export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const payload = Array.isArray(data) ? data : [data]
  return (
    <>
      {payload.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(item) }}
        />
      ))}
    </>
  )
}
