import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { count } = await supabase
    .from('evaluations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          AI Agent Evaluation Dashboard
        </h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl text-white mb-4">Welcome!</h2>
          <p className="text-gray-300">Email: {user.email}</p>
          <p className="text-gray-300 text-sm">User ID: {user.id}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Status</h3>
            <p className="text-2xl font-bold text-green-500">Active</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Total Evaluations</h3>
            <p className="text-2xl font-bold text-white">{count || 0}</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Account Type</h3>
            <p className="text-2xl font-bold text-blue-500">Free</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a 
              href="/config" 
              className="block bg-blue-600 hover:bg-blue-700 text-white p-4 rounded text-center font-semibold"
            >
              Configure Settings
            </a>
            <a 
              href="/evaluations" 
              className="block bg-green-600 hover:bg-green-700 text-white p-4 rounded text-center font-semibold"
            >
              View Evaluations
            </a>
            <a 
              href="/analytics" 
              className="block bg-purple-600 hover:bg-purple-700 text-white p-4 rounded text-center font-semibold"
            >
              Analytics Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
