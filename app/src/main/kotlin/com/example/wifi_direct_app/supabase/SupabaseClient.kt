package com.example.wifi_direct_app.supabase

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.gotrue.Auth

object Supabase {
    // ⚠️ TODO: Replace with your actual Supabase Project URL and Anon Key
    val client: SupabaseClient = createSupabaseClient(
        supabaseUrl = "https://clmflctmeiehioikgvdt.supabase.co",
        supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbWZsY3RtZWllaGlvaWtndmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ4NjEsImV4cCI6MjA5MDgwMDg2MX0.WYUr3dPyuiR_TaXc_vphpWyhzoAPP8dfnmTmFW12u5c"
    ) {
        install(Auth)
        install(Postgrest)
        install(Storage)
    }
}
