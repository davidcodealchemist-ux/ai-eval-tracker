export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">AI Eval Tracker</h1>
      <p className="text-gray-400">Dashboard coming soon...</p>
      
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm text-gray-400">Total Evaluations</h3>
          <p className="text-3xl font-bold mt-2">1,234</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm text-gray-400">Avg Score</h3>
          <p className="text-3xl font-bold mt-2">0.87</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-sm text-gray-400">Avg Latency</h3>
          <p className="text-3xl font-bold mt-2">245ms</p>
        </div>
      </div>
    </div>
  )
}


