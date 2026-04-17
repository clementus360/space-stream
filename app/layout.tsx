import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

import { AppShell } from '@/components/layout/AppShell'

import { ThemeProvider } from '@/context/theme-provider'
import { AuthProvider } from '@/context/auth-provider'
import { UIProvider } from '@/context/ui-provider'
import { StreamProvider } from '@/context/stream-provider'

const gilroy = localFont({
  src: [
    { path: '../fonts/Gilroy-Thin.ttf', weight: '100' },
    { path: '../fonts/Gilroy-Light.ttf', weight: '300' },
    { path: '../fonts/Gilroy-Regular.ttf', weight: '400' },
    { path: '../fonts/Gilroy-Medium.ttf', weight: '500' },
    { path: '../fonts/Gilroy-SemiBold.ttf', weight: '600' },
    { path: '../fonts/Gilroy-Bold.ttf', weight: '700' },
  ],
  variable: '--font-gilroy',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Juru',
  description:
    'Juru is an interactive streaming platform that makes it easy to find and watch your favorite content.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${gilroy.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider defaultTheme="dark" storageKey="juru-theme">
            <UIProvider>
              <StreamProvider>
                <AppShell>
                  {children}
                </AppShell>
              </StreamProvider>
            </UIProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}