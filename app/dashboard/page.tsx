import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Activity, TrendingUp, Clock, Settings, Database, BarChart3, Sparkles, LogOut, ArrowUpRight, Zap, Target, Shield } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get evaluation stats
  const { count } = await supabase
    .from('evaluations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('score, latency_ms, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate stats
  let avgScore = 0
  let avgLatency = 0
  let highPerformanceCount = 0
  let recentEvaluations = 0

  if (evaluations && evaluations.length > 0) {
    avgScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length
    avgLatency = evaluations.reduce((sum, e) => sum + e.latency_ms, 0) / evaluations.length
    highPerformanceCount = evaluations.filter(e => e.score >= 80).length
    
    // Count evaluations from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    recentEvaluations = evaluations.filter(e => new Date(e.created_at) > oneDayAgo).length
  }

  const stats = [
    {
      title: 'Total Evaluations',
      value: (count || 0).toLocaleString(),
      change: `+${recentEvaluations} today`,
      icon: Activity,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/20 to-cyan-500/20',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      changeColor: 'text-cyan-400'
    },
    {
      title: 'Average Score',
      value: avgScore.toFixed(1),
      change: avgScore >= 70 ? 'Excellent' : avgScore >= 50 ? 'Good' : 'Needs Work',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/20 to-emerald-500/20',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      changeColor: avgScore >= 70 ? 'text-green-400' : avgScore >= 50 ? 'text-yellow-400' : 'text-orange-400'
    },
    {
      title: 'Average Latency',
      value: `${Math.round(avgLatency)}ms`,
      change: avgLatency < 200 ? 'Fast' : avgLatency < 500 ? 'Normal' : 'Slow',
      icon: Clock,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/20 to-pink-500/20',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      changeColor: avgLatency < 200 ? 'text-green-400' : avgLatency < 500 ? 'text-yellow-400' : 'text-orange-400'
    },
    {
      title: 'High Performance',
      value: highPerformanceCount.toString(),
      change: count ? `${((highPerformanceCount / (count || 1)) * 100).toFixed(0)}% of total` : '0%',
      icon: Zap,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/20 to-red-500/20',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      changeColor: 'text-orange-400'
    }
  ]

  const quickActions = [
    {
      title: 'View Analytics',
      description: 'Interactive charts and trends',
      href: '/analytics',
      icon: BarChart3,
      gradient: 'from-blue-600 to-cyan-600',
      hoverGradient: 'hover:from-blue-700 hover:to-cyan-700'
    },
    {
      title: 'Browse Evaluations',
      description: 'All evaluation records',
      href: '/evaluations',
      icon: Database,
      gradient: 'from-green-600 to-emerald-600',
      hoverGradient: 'hover:from-green-700 hover:to-emerald-700'
    },
    {
      title: 'Configure Settings',
      description: 'Policies and preferences',
      href: '/config',
      icon: Settings,
      gradient: 'from-purple-600 to-pink-600',
      hoverGradient: 'hover:from-purple-700 hover:to-pink-700'
    }
  ]

  const insights = [
    {
      icon: Target,
      title: 'Performance Target',
      value: avgScore >= 80 ? 'Achieved' : 'In Progress',
      color: avgScore >= 80 ? 'text-green-400' : 'text-yellow-400',
      bgColor: avgScore >= 80 ? 'bg-green-500/10' : 'bg-yellow-500/10'
    },
    {
      icon: Shield,
      title: 'Data Quality',
      value: count && count > 100 ? 'High' : count && count > 10 ? 'Medium' : 'Low',
      color: count && count > 100 ? 'text-green-400' : count && count > 10 ? 'text-blue-400' : 'text-gray-400',
      bgColor: count && count > 100 ? 'bg-green-500/10' : count && count > 10 ? 'bg-blue-500/10' : 'bg-gray-500/10'
    },
    {
      icon: Sparkles,
      title: 'Recent Activity',
      value: recentEvaluations > 0 ? 'Active' : 'Inactive',
      color: recentEvaluations > 0 ? 'text-blue-400' : 'text-gray-400',
      bgColor: recentEvaluations > 0 ? 'bg-blue-500/10' : 'bg-gray-500/10'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
      {/* Enhanced Navigation Bar */}
      <nav className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Eval Tracker
                </span>
              </Link>
              <div className="hidden md:flex space-x-1">
                <Link href="/dashboard" className="flex items-center gap-2 text-white bg-gray-700/50 px-4 py-2 rounded-lg transition-all">
                  <Sparkles className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link href="/analytics" className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all px-4 py-2 rounded-lg">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Link>
                <Link href="/evaluations" className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all px-4 py-2 rounded-lg">
                  <Database className="w-4 h-4" />
                  Evaluations
                </Link>
                <Link href="/config" className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all px-4 py-2 rounded-lg">
                  <Settings className="w-4 h-4" />
                  Config
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="text-sm text-white font-medium">{user.email}</p>
              </div>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-700/50"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Welcome Section with Animated Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-gray-700/50 p-8 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Welcome back! 
            </h1>
            <p className="text-gray-300 text-lg">
              Here&apos;s your AI evaluation performance overview
            </p>
          </div>
        </div>

        {/* Stats Grid - 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className="group relative overflow-hidden bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 p-6 rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.title}</h3>
                    <p className={`text-xs ${stat.changeColor} font-medium`}>{stat.change}</p>
                  </div>
                  <div className={`p-3 ${stat.iconBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Insights Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight) => (
            <div key={insight.title} className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`p-3 ${insight.bgColor} rounded-xl`}>
                  <insight.icon className={`w-6 h-6 ${insight.color}`} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{insight.title}</p>
                  <p className={`text-xl font-bold ${insight.color}`}>{insight.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 p-8 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className={`group relative overflow-hidden p-6 bg-gradient-to-r ${action.gradient} ${action.hoverGradient} rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-lg group-hover:bg-white/20 transition-all group-hover:scale-110 duration-300">
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                      {action.title}
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-white/80 text-sm">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 p-8 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700/30 border border-gray-600/50 p-5 rounded-xl hover:bg-gray-700/50 transition-all">
              <p className="text-gray-400 text-sm mb-2">Email Address</p>
              <p className="text-white font-medium">{user.email}</p>
            </div>
            <div className="bg-gray-700/30 border border-gray-600/50 p-5 rounded-xl hover:bg-gray-700/50 transition-all">
              <p className="text-gray-400 text-sm mb-2">User ID</p>
              <p className="text-white font-mono text-sm truncate">{user.id}</p>
            </div>
            <div className="bg-gray-700/30 border border-gray-600/50 p-5 rounded-xl hover:bg-gray-700/50 transition-all">
              <p className="text-gray-400 text-sm mb-2">Account Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-400 font-semibold">Active</p>
              </div>
            </div>
            <div className="bg-gray-700/30 border border-gray-600/50 p-5 rounded-xl hover:bg-gray-700/50 transition-all">
              <p className="text-gray-400 text-sm mb-2">Plan Type</p>
              <p className="text-blue-400 font-semibold flex items-center gap-2">
                Free Tier
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Active</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
