import React from 'react'

export default function PageWrapper({ children }) {
  return (
    <div className="w-full min-h-screen p-2 md:p-6 text-slate-100 space-y-6">
      {children}
    </div>
  )
}
