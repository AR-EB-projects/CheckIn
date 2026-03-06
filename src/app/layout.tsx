import './globals.css'

export const metadata = {
  title: 'Dalida Dance NFC System',
  description: 'NFC Check-in system for Dalida Dance Studio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  )
}