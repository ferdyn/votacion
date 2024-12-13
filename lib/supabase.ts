import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and Anon Key must be provided. Please check your environment variables.')
  throw new Error('Missing Supabase configuration. See console for details.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

