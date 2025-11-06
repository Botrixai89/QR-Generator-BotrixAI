import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data } = await supabaseAdmin!
      .from('BillingProfile')
      .select('*')
      .eq('userId', session.user.id)
      .maybeSingle()
    return NextResponse.json({ profile: data || null })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const payload: {
      userId: string
      billingEmail: string | null
      billingName: string | null
      country: string | null
      addressLine1: string | null
      addressLine2: string | null
      city: string | null
      state: string | null
      postalCode: string | null
      taxId: string | null
      updatedAt: string
    } = {
      userId: session.user.id,
      billingEmail: body.billingEmail || null,
      billingName: body.billingName || null,
      country: body.country || null,
      addressLine1: body.addressLine1 || null,
      addressLine2: body.addressLine2 || null,
      city: body.city || null,
      state: body.state || null,
      postalCode: body.postalCode || null,
      taxId: body.taxId || null,
      updatedAt: new Date().toISOString(),
    }

    // Upsert profile
    const { data, error } = await supabaseAdmin!
      .from('BillingProfile')
      .upsert(payload, { onConflict: 'userId' })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
    }
    return NextResponse.json({ profile: data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


