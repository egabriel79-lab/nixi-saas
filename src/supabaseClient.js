import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://lyjvuswlvppqojedggan.supabase.co';
// Clave anon public de Supabase:
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5anZ1c3dsdnBwcW9qZWRnZ2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzMyNDgsImV4cCI6MjA4NzQ0OTI0OH0.T-K54jKLOR_OH6PPFsSE61MDbeI5UnII8tlKm-fW4VM';

export const isSupabaseConfigured = () => {
  return (
    Boolean(SUPABASE_URL) &&
    SUPABASE_URL.startsWith('http') &&
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_ANON_KEY.includes('PEGA_AQUI')
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
