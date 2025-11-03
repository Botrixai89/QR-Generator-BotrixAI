import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET - Get translations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const locale = searchParams.get('locale') || 'en'
    const namespace = searchParams.get('namespace') || 'common'

    let query = supabaseAdmin!
      .from('I18nTranslation')
      .select('*')
      .eq('locale', locale)

    if (namespace) {
      query = query.eq('namespace', namespace)
    }

    if (key) {
      query = query.eq('key', key)
    }

    const { data: translations, error } = await query

    if (error) {
      console.error("Error fetching translations:", error)
      return NextResponse.json(
        { error: "Failed to fetch translations" },
        { status: 500 }
      )
    }

    // If single key requested, return single translation
    if (key && translations && translations.length > 0) {
      return NextResponse.json({
        key: translations[0].key,
        locale: translations[0].locale,
        value: translations[0].value,
        namespace: translations[0].namespace,
      })
    }

    // Return all translations for namespace
    return NextResponse.json(translations || [])
  } catch (error) {
    console.error("Error fetching translations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

