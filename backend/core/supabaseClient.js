import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
// Load .env variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.ANON_KEY
logger.debug("Supabase URL:", process.env.SUPABASE_URL);
const supabase = createClient(supabaseUrl, supabaseKey)


export { supabase };