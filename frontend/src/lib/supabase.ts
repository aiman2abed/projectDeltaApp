import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Session ownership is scoped to the browser tab lifetime to reduce stale-login surprises.
        storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
      }
    }
  )
