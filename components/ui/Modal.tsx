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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md relative">
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