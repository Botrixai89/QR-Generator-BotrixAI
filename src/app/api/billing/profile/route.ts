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
    const { data } = await supabaseAdmin!
      .from('BillingProfile')
      .select('*')
      .eq('userId', session.user.id)
      .maybeSingle()
    return NextResponse.json({ profile: data || null })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const payload: any = {
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
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


