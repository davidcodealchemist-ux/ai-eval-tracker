'use client'

import Link from 'next/link'
import { LogOut, Home, BarChart3, Database, Settings } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Eval Tracker
            </Link>
            <div className="hidden md:flex space-x-2">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50">
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/analytics" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
              <Link href="/evaluations" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50">
                <Database className="w-4 h-4" />
                Evaluations
              </Link>
              <Link href="/config" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50">
                <Settings className="w-4 h-4" />
                Config
              </Link>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-700/50"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
