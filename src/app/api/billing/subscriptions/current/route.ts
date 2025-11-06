import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: sub } = await supabaseAdmin!
      .from('Subscription')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ subscription: sub || null })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

