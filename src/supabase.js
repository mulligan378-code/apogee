import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://gtmhyngqocjmvrpyvdew.supabase.co"
const supabaseKey = "sb_publishable_tytNPM5EJBA9okj-Mtm4Hw_98a-XHRC"

export const supabase = createClient(supabaseUrl, supabaseKey)
