'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadEvaluations()
  }, [page])

  async function loadEvaluations() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (data) {
      setEvaluations(data)
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a href="/dashboard" className="text-blue-500 hover:underline">
            Back to Dashboard
          </a>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Evaluations</h1>
          <p className="text-gray-400">Total: {totalCount} evaluations</p>
        </div>

        {loading ? (
          <div className="text-center text-white py-12">Loading...</div>
        ) : evaluations.length === 0 ? (
          <div className="bg-gray-800 p-12 rounded-lg text-center">
            <p className="text-gray-400 text-lg">No evaluations yet</p>
            <p className="text-gray-500 mt-2">Run npm run seed to generate data</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-4 text-gray-300">ID</th>
                    <th className="text-left p-4 text-gray-300">Prompt</th>
                    <th className="text-left p-4 text-gray-300">Score</th>
                    <th className="text-left p-4 text-gray-300">Latency</th>
                    <th className="text-left p-4 text-gray-300">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="p-4 text-white font-mono text-sm">
                        {evaluation.interaction_id}
                      </td>
                      <td className="p-4 text-gray-300 max-w-xs truncate">
                        {evaluation.prompt}
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${
                          evaluation.score >= 70 
                            ? 'text-green-500' 
                            : evaluation.score >= 40 
                            ? 'text-yellow-500' 
                            : 'text-red-500'
                        }`}>
                          {evaluation.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{evaluation.latency_ms}ms</td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(evaluation.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="text-white">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
