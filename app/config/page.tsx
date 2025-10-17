'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfigPage() {
  const [config, setConfig] = useState({
    run_policy: 'always',
    sample_rate_pct: 100,
    obfuscate_pii: false,
    max_eval_per_day: 10000
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const loadConfig = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('user_configs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setConfig(data)
    }
  }, [supabase, router])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('user_configs')
      .upsert({
        user_id: user.id,
        ...config,
        updated_at: new Date().toISOString()
      })

    setLoading(false)
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Configuration saved successfully!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <a href="/dashboard" className="text-blue-500 hover:underline">Back to Dashboard</a>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Evaluation Configuration</h1>
        <p className="text-gray-400 mb-8">Configure how your AI agent evaluations are processed</p>

        {message && (
          <div className={`p-4 rounded mb-6 ${message.includes('Error') ? 'bg-red-500/10 border border-red-500 text-red-500' : 'bg-green-500/10 border border-green-500 text-green-500'}`}>
            {message}
          </div>
        )}

        <form onSubmit={saveConfig} className="bg-gray-800 p-8 rounded-lg space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">Run Policy</label>
            <select
              value={config.run_policy}
              onChange={(e) => setConfig({...config, run_policy: e.target.value})}
              className="w-full p-3 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="always">Always</option>
              <option value="sampled">Sampled</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Sample Rate: {config.sample_rate_pct}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.sample_rate_pct}
              onChange={(e) => setConfig({...config, sample_rate_pct: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex items-center text-white cursor-pointer">
              <input
                type="checkbox"
                checked={config.obfuscate_pii}
                onChange={(e) => setConfig({...config, obfuscate_pii: e.target.checked})}
                className="w-5 h-5 mr-3"
              />
              <span>Obfuscate PII</span>
            </label>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Max Evaluations Per Day</label>
            <input
              type="number"
              min="1"
              max="100000"
              value={config.max_eval_per_day}
              onChange={(e) => setConfig({...config, max_eval_per_day: parseInt(e.target.value)})}
              className="w-full p-3 bg-gray-700 text-white rounded"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  )
}
