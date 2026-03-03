import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
// Load .env variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


export { supabase };