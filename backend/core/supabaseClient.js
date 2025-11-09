import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.ANON_KEY
console.log("Supabase URL:", process.env.SUPABASE_URL);
const supabase = createClient(supabaseUrl, supabaseKey)


export { supabase };