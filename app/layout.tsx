import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientAuthProvider } from './components/client/ClientAuthProvider'
import { ProfileProvider } from './lib/profile-context'
import { NavBarWithAuth } from './components/NavBarWithAuth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Snap2Health | AI-Powered Nutrition Analysis',
  description: 'Analyze your meals instantly with AI-powered nutrition insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientAuthProvider>
          <ProfileProvider>
            <div className="min-h-screen bg-slate-900">
              <NavBarWithAuth />
              
              {/* Main Content */}
              <main>
                {children}
              </main>
            </div>
          </ProfileProvider>
        </ClientAuthProvider>
      </body>
    </html>
  )
} 