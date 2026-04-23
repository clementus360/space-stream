'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react' // optional icon, you can swap with your own

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 sm:items-center">
      <div className="relative w-full max-w-md rounded-lg bg-background p-4 shadow-lg sm:p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {children}
      </div>
    </div>
  )
}