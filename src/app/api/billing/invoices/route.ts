import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data, error } = await supabaseAdmin!
      .from('Invoice')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
    if (error) {
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }
    return NextResponse.json({ invoices: data || [] })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


