'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, Activity, Clock, AlertTriangle, Award, ArrowLeft, Loader2, BarChart3, Calendar } from 'lucide-react'
import Link from 'next/link'

interface ScoreDistribution {
  range: string
  count: number
  percentage: number
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
  percentage: number
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
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('14')
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

  const loadAnalytics = useCallback(async () => {
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

    // Score distribution
    const scoreRanges: Record<string, number> = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      '50-59': 0,
      'Below 50': 0
    }

    evaluations.forEach(e => {
      if (e.score >= 90) scoreRanges['90-100']++
      else if (e.score >= 80) scoreRanges['80-89']++
      else if (e.score >= 70) scoreRanges['70-79']++
      else if (e.score >= 60) scoreRanges['60-69']++
      else if (e.score >= 50) scoreRanges['50-59']++
      else scoreRanges['Below 50']++
    })

    const scoreDistribution: ScoreDistribution[] = Object.entries(scoreRanges).map(([range, count]) => ({
      range,
      count,
      percentage: (count / total) * 100
    }))

    // Daily trends
    const dailyData: Record<string, { date: string; count: number; totalScore: number; totalLatency: number }> = {}
    evaluations.forEach(e => {
      const date = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
    })).slice(-parseInt(timeRange))

    // Top flags
    const flagCounts: Record<string, number> = {}
    evaluations.forEach(e => {
      if (e.flags && Array.isArray(e.flags)) {
        e.flags.forEach((flag: string) => {
          flagCounts[flag] = (flagCounts[flag] || 0) + 1
        })
      }
    })

    const topFlags: TopFlag[] = Object.entries(flagCounts)
      .map(([flag, count]) => ({
        flag,
        count,
        percentage: (count / total) * 100
      }))
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
  }, [supabase, router, timeRange])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/95 backdrop-blur-lg border border-gray-700 p-4 rounded-lg shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7' | '14' | '30')}
                className="bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 Days</option>
                <option value="14">Last 14 Days</option>
                <option value="30">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-blue-400" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-400">Deep insights into your AI evaluation performance</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading analytics data...</p>
            </div>
          </div>
        ) : stats.total === 0 ? (
          <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 p-16 rounded-2xl text-center">
            <Activity className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Data Available</h2>
            <p className="text-gray-400 mb-6">Start by adding some evaluation data</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-lg border border-blue-500/30 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-blue-400" />
                  <div className="text-right">
                    <p className="text-blue-300 text-sm font-medium">Total Evaluations</p>
                    <p className="text-4xl font-bold text-white">{stats.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-lg border border-green-500/30 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <div className="text-right">
                    <p className="text-green-300 text-sm font-medium">Average Score</p>
                    <p className="text-4xl font-bold text-white">{stats.avgScore}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-lg border border-purple-500/30 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-purple-400" />
                  <div className="text-right">
                    <p className="text-purple-300 text-sm font-medium">Average Latency</p>
                    <p className="text-4xl font-bold text-white">{stats.avgLatency}ms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Trend Chart */}
            <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 p-8 rounded-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                Performance Trends
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={stats.dailyTrend}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="count" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} name="Evaluations" />
                  <Area type="monotone" dataKey="avgScore" stroke="#10B981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} name="Avg Score" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Score Distribution & Top Flags */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Distribution */}
              <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 p-8 rounded-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-400" />
                  Score Distribution
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="range" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Flags */}
              <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 p-8 rounded-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                  Top Issues
                </h2>
                {stats.topFlags.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topFlags.map((item, idx) => (
                      <div key={idx} className="bg-gray-700/30 p-4 rounded-lg hover:bg-gray-700/50 transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-medium">{item.flag}</span>
                          <span className="text-orange-400 font-bold">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{item.percentage.toFixed(1)}% of total</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No flags recorded</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
