package com.example.wifi_direct_app.supabase

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.gotrue.Auth

object Supabase {
    // ⚠️ TODO: Replace with your actual Supabase Project URL and Anon Key
    val client: SupabaseClient = createSupabaseClient(
        supabaseUrl = "https://drtuusiksszevnezajbg.supabase.co",
        supabaseKey = "sb_publishable_RhUCFQzosELd_kGoGJnSIw_l6YVmm48"
    ) {
        install(Auth)
        install(Postgrest)
    }
}
