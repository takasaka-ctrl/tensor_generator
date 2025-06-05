import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import clsx from 'clsx'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Image Dashboard',
  description: 'Manage Tensor.art generations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={clsx(
          inter.className,
          'bg-gray-100 w-screen min-h-screen flex items-center justify-center',
        )}
      >
        {children}
      </body>
    </html>
  )
}
