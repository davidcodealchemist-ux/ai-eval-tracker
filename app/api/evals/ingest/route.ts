import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.interaction_id) {
      return NextResponse.json({ error: 'interaction_id is required' }, { status: 400 })
    }

    // Get user config
    const { data: config } = await supabase
      .from('user_configs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Apply sampling logic
    if (config?.run_policy === 'sampled') {
      const shouldSample = Math.random() * 100 < (config.sample_rate_pct || 100)
      if (!shouldSample) {
        return NextResponse.json({ status: 'skipped', reason: 'sampling' }, { status: 200 })
      }
    }

    // Check daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    if (count && count >= (config?.max_eval_per_day || 10000)) {
      return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 })
    }

    // Mask PII if enabled
    let prompt = body.prompt || ''
    let response = body.response || ''
    let piiTokensRedacted = 0

    if (config?.obfuscate_pii) {
      // Simple PII masking (email, phone, SSN patterns)
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
      const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
      const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g
      
      const emailMatches = (prompt + response).match(emailRegex) || []
      const phoneMatches = (prompt + response).match(phoneRegex) || []
      const ssnMatches = (prompt + response).match(ssnRegex) || []
      
      piiTokensRedacted = emailMatches.length + phoneMatches.length + ssnMatches.length
      
      prompt = prompt.replace(emailRegex, '[EMAIL_REDACTED]')
                     .replace(phoneRegex, '[PHONE_REDACTED]')
                     .replace(ssnRegex, '[SSN_REDACTED]')
      
      response = response.replace(emailRegex, '[EMAIL_REDACTED]')
                         .replace(phoneRegex, '[PHONE_REDACTED]')
                         .replace(ssnRegex, '[SSN_REDACTED]')
    }

    // Insert evaluation
    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        user_id: user.id,
        interaction_id: body.interaction_id,
        prompt,
        response,
        score: body.score || 0,
        latency_ms: body.latency_ms || 0,
        flags: body.flags || [],
        pii_tokens_redacted: piiTokensRedacted,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      pii_tokens_redacted: piiTokensRedacted 
    }, { status: 201 })

  } catch (error: unknown) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }, { status: 500 })
  }
}
