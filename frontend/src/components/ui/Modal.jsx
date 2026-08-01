import React from 'react'

export default function Modal({ open = true, onClose, title, children, wide }) {
  if (!open) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-2xl'} w-full max-h-[92vh] flex flex-col overflow-hidden transition-all transform scale-100`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>✨</span> {title}
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
