import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function PageWrapper({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 md:ml-60 min-w-0 flex flex-col">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
