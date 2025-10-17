require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

const prompts = [
  'What is AI?',
  'Explain machine learning',
  'What is deep learning?',
  'How does NLP work?',
  'What is supervised learning?',
  'Explain reinforcement learning',
  'What is computer vision?',
  'Define neural networks',
  'What is a CNN?',
  'Explain transformers',
  'What are GANs?',
  'Explain gradient descent',
  'What is backpropagation?',
  'Define overfitting',
  'What is a perceptron?'
]

const responses = [
  'AI simulates human intelligence in machines.',
  'ML enables systems to learn from data.',
  'Deep learning uses neural networks with many layers.',
  'NLP helps computers understand human language.',
  'Supervised learning trains on labeled data.',
  'RL trains agents through rewards.',
  'Computer vision interprets visual information.',
  'Neural networks are inspired by the brain.',
  'CNNs are designed for image processing.',
  'Transformers use attention mechanisms.',
  'GANs generate new data from learned patterns.',
  'Gradient descent optimizes model parameters.',
  'Backpropagation calculates gradients for learning.',
  'Overfitting occurs when model memorizes training data.',
  'A perceptron is a basic neural network unit.'
]

const flags = ['helpful', 'accurate', 'detailed', 'clear', 'excellent', 'technical', 'basic', 'advanced']

async function seed() {
  console.log('AI Evaluation Tracker - Seed Script')
  console.log('====================================\n')
  
  const email = await question('Enter your email: ')
  const password = await question('Enter your password: ')
  
  console.log('\nAuthenticating...')
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim()
  })
  
  if (authError || !authData.user) {
    console.error('ERROR: Authentication failed:', authError?.message || 'Unknown error')
    rl.close()
    process.exit(1)
  }
  
  const user = authData.user
  console.log('SUCCESS: Authenticated as:', user.email)
  
  const { error: configError } = await supabase
    .from('user_configs')
    .upsert({
      user_id: user.id,
      run_policy: 'always',
      sample_rate_pct: 100,
      obfuscate_pii: false,
      max_eval_per_day: 50000
    })
  
  if (configError) {
    console.log('Config note:', configError.message)
  } else {
    console.log('SUCCESS: User config created')
  }
  
  const totalRows = 500
  const batchSize = 100
  let inserted = 0
  
  console.log('\nInserting', totalRows, 'evaluation records...\n')
  
  for (let i = 0; i < totalRows; i += batchSize) {
    const batch = []
    
    for (let j = 0; j < batchSize && (i + j) < totalRows; j++) {
      const idx = (i + j) % prompts.length
      const daysAgo = Math.floor(Math.random() * 30)
      
      batch.push({
        user_id: user.id,
        interaction_id: 'eval_' + String(i + j + 1).padStart(6, '0'),
        prompt: prompts[idx],
        response: responses[idx],
        score: Math.round((Math.random() * 40 + 60) * 10) / 10,
        latency_ms: Math.floor(Math.random() * 1500 + 500),
        flags: [flags[Math.floor(Math.random() * flags.length)]],
        pii_tokens_redacted: Math.floor(Math.random() * 3),
        created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
      })
    }
    
    const { error } = await supabase.from('evaluations').insert(batch)
    
    if (error) {
      console.error('ERROR: Batch', i, ':', error.message)
    } else {
      inserted += batch.length
      console.log('Progress:', inserted, '/', totalRows)
    }
  }
  
  console.log('\nCOMPLETE: Inserted', inserted, 'evaluations for', user.email)
  console.log('Refresh your dashboard to see the data!')
  
  await supabase.auth.signOut()
  rl.close()
}

seed().catch(err => {
  console.error('ERROR:', err)
  rl.close()
  process.exit(1)
})
