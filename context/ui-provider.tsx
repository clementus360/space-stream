'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type UIContextType = {
  isSideMenuOpen: boolean
  toggleSideMenu: () => void
  openSideMenu: () => void
  closeSideMenu: () => void
  // You can add more toggles here later
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true)

  const toggleSideMenu = () => setIsSideMenuOpen((prev) => !prev)
  const openSideMenu = () => setIsSideMenuOpen(true)
  const closeSideMenu = () => setIsSideMenuOpen(false)

  return (
    <UIContext.Provider
      value={{ isSideMenuOpen, toggleSideMenu, openSideMenu, closeSideMenu }}
    >
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) throw new Error('useUI must be used within a UIProvider')
  return context
}