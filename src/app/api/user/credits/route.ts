import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: user, error } = await supabaseAdmin!
      .from('User')
      .select('credits, plan')
      .eq('id', session.user.id)
      .single()

    if (error || !user) {
      console.error("Error fetching user:", error)
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      credits: user.credits || 0,
      plan: user.plan || 'FREE'
    })

  } catch (error) {
    console.error("Error fetching user credits:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
