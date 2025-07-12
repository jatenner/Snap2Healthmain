import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientAuthProvider } from './components/client/ClientAuthProvider'
import { ProfileProvider } from './lib/profile-context'
import { NavBarWithAuth } from './components/NavBarWithAuth'
import dynamic from 'next/dynamic'
import ErrorBoundaryWrapper from './components/ErrorBoundaryWrapper'
import ClientProviders from './components/client/ClientProviders'

const inter = Inter({ subsets: ['latin'] })

const GlobalAIChat = dynamic(() => import('./components/GlobalAIChat'), {
  ssr: false,
  loading: () => (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="w-14 h-14 bg-purple-600 rounded-full shadow-lg animate-pulse">
        <div className="w-full h-full flex items-center justify-center text-white">
          💬
        </div>
      </div>
    </div>
  )
})

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
        <ErrorBoundaryWrapper>
          <ClientProviders>
            <ClientAuthProvider>
              <ProfileProvider>
                <div className="min-h-screen bg-slate-900">
                  <NavBarWithAuth />
                  
                  {/* Main Content with proper padding for fixed header */}
                  <main className="pt-16">
                    {children}
                  </main>
                  
                  {/* Global AI Chat Widget */}
                  <GlobalAIChat />
                  
                </div>
              </ProfileProvider>
            </ClientAuthProvider>
          </ClientProviders>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
} 