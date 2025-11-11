import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'test-v3-blog',
  description: 'Built with SSOT CodeGen V3 JSON Runtime',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
