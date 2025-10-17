'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ScoreDistribution {
  range: string
  count: number
}

interface DailyTrend {
  date: string
  count: number
  avgScore: number
  avgLatency: number
}

interface TopFlag {
  flag: string
  count: number
}

interface Stats {
  total: number
  avgScore: number
  avgLatency: number
  scoreDistribution: ScoreDistribution[]
  dailyTrend: DailyTrend[]
  topFlags: TopFlag[]
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    avgScore: 0,
    avgLatency: 0,
    scoreDistribution: [],
    dailyTrend: [],
    topFlags: []
  })
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (!evaluations || evaluations.length === 0) {
      setLoading(false)
      return
    }

    const total = evaluations.length
    const avgScore = evaluations.reduce((sum, e) => sum + e.score, 0) / total
    const avgLatency = evaluations.reduce((sum, e) => sum + e.latency_ms, 0) / total

    const scoreRanges: Record<string, number> = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      'Below 60': 0
    }

    evaluations.forEach(e => {
      if (e.score >= 90) scoreRanges['90-100']++
      else if (e.score >= 80) scoreRanges['80-89']++
      else if (e.score >= 70) scoreRanges['70-79']++
      else if (e.score >= 60) scoreRanges['60-69']++
      else scoreRanges['Below 60']++
    })

    const scoreDistribution: ScoreDistribution[] = Object.entries(scoreRanges).map(([range, count]) => ({
      range,
      count
    }))

    const dailyData: Record<string, { date: string; count: number; totalScore: number; totalLatency: number }> = {}
    evaluations.forEach(e => {
      const date = new Date(e.created_at).toLocaleDateString()
      if (!dailyData[date]) {
        dailyData[date] = { date, count: 0, totalScore: 0, totalLatency: 0 }
      }
      dailyData[date].count++
      dailyData[date].totalScore += e.score
      dailyData[date].totalLatency += e.latency_ms
    })

    const dailyTrend: DailyTrend[] = Object.values(dailyData).map(d => ({
      date: d.date,
      count: d.count,
      avgScore: parseFloat((d.totalScore / d.count).toFixed(1)),
      avgLatency: Math.round(d.totalLatency / d.count)
    })).slice(-14)

    const flagCounts: Record<string, number> = {}
    evaluations.forEach(e => {
      if (e.flags && Array.isArray(e.flags)) {
        e.flags.forEach((flag: string) => {
          flagCounts[flag] = (flagCounts[flag] || 0) + 1
        })
      }
    })

    const topFlags: TopFlag[] = Object.entries(flagCounts)
      .map(([flag, count]) => ({ flag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setStats({
      total,
      avgScore: parseFloat(avgScore.toFixed(1)),
      avgLatency: Math.round(avgLatency),
      scoreDistribution,
      dailyTrend,
      topFlags
    })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a href="/dashboard" className="text-blue-500 hover:underline">
            Back to Dashboard
          </a>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8">Analytics Dashboard</h1>

        {loading ? (
          <div className="text-center text-white py-12">Loading analytics...</div>
        ) : stats.total === 0 ? (
          <div className="bg-gray-800 p-12 rounded-lg text-center">
            <p className="text-gray-400 text-lg">No data available</p>
            <p className="text-gray-500 mt-2">Run npm run seed to generate evaluation data</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-gray-400 text-sm mb-2">Total Evaluations</h3>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-gray-400 text-sm mb-2">Average Score</h3>
                <p className="text-3xl font-bold text-green-500">{stats.avgScore}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-gray-400 text-sm mb-2">Average Latency</h3>
                <p className="text-3xl font-bold text-blue-500">{stats.avgLatency}ms</p>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Daily Trend (Last 14 Days)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" name="Count" />
                  <Line type="monotone" dataKey="avgScore" stroke="#10B981" name="Avg Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Score Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="range" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-white mb-4">Top Flags</h2>
                <div className="space-y-3">
                  {stats.topFlags.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-gray-300">{item.flag}</span>
                      <span className="text-white font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
