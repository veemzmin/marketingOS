import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { TopNav } from '@/components/layout/TopNav'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Marketing OS',
  description: 'AI-powered content generation with governance at generation time',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <TopNav />
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
