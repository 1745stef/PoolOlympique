import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://otkxiifykgfjojxnpqsb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90a3hpaWZ5a2dmam9qeG5wcXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzUyNDYsImV4cCI6MjA4Nzg1MTI0Nn0.qzirWDMht5yL9_zXsnknnOL3Fe2NQbvfM4DWRdhZXAQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
