import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // 🔥 This forces Supabase to forget the user when the browser closes
        storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
      }
    }
  )